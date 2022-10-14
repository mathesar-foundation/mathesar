from sqlalchemy import select

from db.records.operations import select as records_select
from db.columns.base import MathesarColumn
from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations.select import reflect_table_from_oid
from db.transforms.operations.apply import apply_transformations
from db.metadata import get_empty_metadata


class DBQuery:
    def __init__(
            self,
            base_table_oid,
            initial_columns,
            engine,
            transformations=None,
            name=None,
    ):
        self.base_table_oid = base_table_oid
        for initial_col in initial_columns:
            assert isinstance(initial_col, InitialColumn)
        self.initial_columns = initial_columns
        self.engine = engine
        self.transformations = transformations
        self.name = name

    # mirrors a method in db.records.operations.select
    def get_records(self, **kwargs):
        # NOTE how through this method you can perform a second batch of
        # transformations.  this reflects fact that we can form a query, and
        # then apply temporary transforms on it, like how you can apply
        # temporary transforms to a table when in a table view.
        return records_select.get_records_with_default_order(
            table=self.transformed_relation, engine=self.engine, **kwargs,
        )

    # mirrors a method in db.records.operations.select
    def get_count(self, **kwargs):
        return records_select.get_count(
            table=self.transformed_relation, engine=self.engine, **kwargs,
        )

    @property
    def all_sa_columns_map(self):
        """
        Expensive! use with care.
        """
        initial_columns_map = {
            col.name: MathesarColumn.from_column(col, engine=self.engine)
            for col in self.initial_relation.columns
        }
        output_columns_map = {
            col.name: col for col in self.sa_output_columns
        }
        transforms_columns_map = {} if self.transformations is None else {
            col.name: MathesarColumn.from_column(col, engine=self.engine)
            for i in range(len(self.transformations))
            for col in DBQuery(
                base_table_oid=self.base_table_oid,
                initial_columns=self.initial_columns,
                engine=self.engine,
                transformations=self.transformations[:i],
                name=f'{self.name}_{i}'
            ).transformed_relation.columns
        }

        return initial_columns_map | transforms_columns_map | output_columns_map

    @property
    def sa_output_columns(self):
        """
        Sequence of SQLAlchemy columns representing the output columns of the
        relation described by this query.
        """
        return tuple(
            MathesarColumn.from_column(sa_col, engine=self.engine)
            for sa_col
            in self.transformed_relation.columns
        )

    @property
    def transformed_relation(self):
        """
        A query describes a relation. This property is the result of parsing a
        query into a relation.
        """
        transformations = self.transformations
        if transformations:
            transformed = apply_transformations(
                self.initial_relation,
                transformations,
            )
            return transformed
        else:
            return self.initial_relation

    @property
    def initial_relation(self):
        # TODO reuse metadata
        metadata = get_empty_metadata()
        base_table = reflect_table_from_oid(
            self.base_table_oid, self.engine, metadata=metadata
        )
        from_clause = base_table
        # We cache this to avoid copies of the same join path to a given table
        jp_path_alias_map = {(): base_table}

        def _get_table(oid):
            """
            We use the function-scoped metadata so all involved tables are aware
            of each other.
            """
            return reflect_table_from_oid(oid, self.engine, metadata=metadata)

        def _get_column_name(oid, attnum, metadata):
            return get_column_name_from_attnum(oid, attnum, self.engine, metadata=metadata)

        def _process_initial_column(col, metadata):
            nonlocal from_clause
            col_name = _get_column_name(col.reloid, col.attnum, metadata=metadata)
            # Make the path hashable so it can be a dict key
            jp_path = _guarantee_jp_path_tuples(col.jp_path)
            right = base_table

            for i, jp in enumerate(jp_path):
                left = jp_path_alias_map[jp_path[:i]]
                right = _get_table(jp[1][0]).alias()
                jp_path_alias_map[jp_path[:i + 1]] = right
                left_col_name = _get_column_name(jp[0][0], jp[0][1], metadata=metadata)
                right_col_name = _get_column_name(jp[1][0], jp[1][1], metadata=metadata)
                left_col = left.columns[left_col_name]
                right_col = right.columns[right_col_name]
                from_clause = from_clause.join(
                    right, onclause=left_col == right_col, isouter=True,
                )

            return right.columns[col_name].label(col.alias)

        stmt = select(
            [_process_initial_column(col, metadata=metadata) for col in self.initial_columns]
        ).select_from(from_clause)
        return stmt.cte()


def _guarantee_jp_path_tuples(jp_path):
    if jp_path is not None:
        return tuple((tuple(edge[0]), tuple(edge[1])) for edge in jp_path)
    else:
        return ()


class InitialColumn:
    def __init__(
            self,
            reloid,
            attnum,
            alias,
            jp_path=None,
    ):
        # alias mustn't be an empty string
        assert isinstance(alias, str) and alias.strip() != ""
        self.reloid = reloid
        self.attnum = attnum
        self.alias = alias
        if jp_path is not None:
            self.jp_path = tuple(
                [tuple([tuple(edge[0]), tuple(edge[1])]) for edge in jp_path]
            )
        else:
            self.jp_path = None

    @property
    def is_base_column(self):
        return self.jp_path is None
