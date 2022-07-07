from collections import namedtuple

from sqlalchemy import select, join, Column as SAColumn, Table as SATable

from django.utils.functional import cached_property

from db.records.operations import select as records_select
from db.columns.base import MathesarColumn


class DBQuery:
    def __init__(
        self,
        base_table,
        initial_columns,
        transformations=None,
        name=None
    ):
        assert isinstance(base_table, SATable)
        self.base_table = base_table
        for initial_col in initial_columns:
            assert isinstance(initial_col, InitialColumn)
        self.initial_columns = initial_columns
        self.transformations = transformations
        self.name = name

    # mirrors a method in db.records.operations.select
    def get_records(self, **kwargs):
        return records_select.get_records(
            table=self.sa_relation,
            **kwargs,
        )

    # mirrors a method in db.records.operations.select
    def get_count(self, **kwargs):
        return records_select.get_count(table=self.sa_relation, **kwargs)

    @cached_property
    def sa_output_columns(self):
        """
        Sequence of SQLAlchemy columns representing the output columns of the relation described
        by this query.
        """
        return self.sa_relation.columns

    @cached_property
    def sa_relation(self):
        """
        A query describes a relation. This property is the result of parsing a query into a
        relation.
        """
        initial_relation = _get_initial_relation(self)
        transformed = _apply_transformations(initial_relation, self.transformations)
        return transformed


class InitialColumn:
    def __init__(
        self,
        alias,
        column,
        jp_path=None,
    ):
        # alias mustn't be an empty string
        assert isinstance(alias, str) and alias.strip() != ""
        self.alias = alias

        if jp_path is not None:
            # jp_path must be made up of JoinParams
            for jp in jp_path:
                assert isinstance(jp, JoinParams)
        self.jp_path = jp_path

        # column must be SA Column, and not MathesarColumn (MathesarColumn is incompatible with some
        # of SA's joining mechanics).
        assert isinstance(column, SAColumn)
        assert not isinstance(column, MathesarColumn)

        # column must have a table with a schema associated.
        table = column.table
        assert table is not None
        schema_name = table.schema
        assert schema_name is not None

        self.column = column

    @property
    def is_base_column(self):
        return self.jp_path is None


class JoinParams(
    namedtuple(
        'JoinParams',
        [
            'left_column',
            'right_column',
        ]
    )
):
    """
    Describes parameters for a join. Namely, the table and column pairs on both sides of the join.
    """
    def flip(self):
        return JoinParams(
            left_column=self.right_column,
            right_column=self.left_column,
        )

    @property
    def left_table(self):
        return self.left_column.table

    @property
    def right_table(self):
        return self.right_column.table


def _apply_transformations(initial_relation, transformations):
    return initial_relation


def _get_initial_relation(query):
    sa_columns_to_select = []
    from_clause = query.base_table
    for initial_column in query.initial_columns:
        from_clause, sa_column_to_select = _process_initial_column(
            initial_column=initial_column,
            from_clause=from_clause,
        )
        sa_columns_to_select.append(sa_column_to_select)
    stmt = select(*sa_columns_to_select).select_from(from_clause)
    return stmt.cte()


def _process_initial_column(initial_column, from_clause):
    if initial_column.is_base_column:
        col_to_select = initial_column.column
    else:
        from_clause, col_to_select = _nest_a_join(
            initial_column=initial_column,
            from_clause=from_clause,
        )
    # Give an alias/label to this column, since that's how it will be referenced in transforms.
    aliased_col_to_select = col_to_select.label(initial_column.alias)
    return from_clause, aliased_col_to_select


def _nest_a_join(from_clause, initial_column):
    jp_path = initial_column.jp_path
    target_sa_column = initial_column.column
    rightmost_table_alias = None
    ix_of_last_jp = len(jp_path) - 1
    for i, jp in enumerate(jp_path):
        is_last_jp = i == ix_of_last_jp
        # We want to alias the right-most table in the JP path, so that we can select from it later
        if is_last_jp:
            rightmost_table_alias = jp.right_table.alias()
            right_table = rightmost_table_alias
            right_column_reference = (
                # If we give the right table an alias, we have to use that alias whenever we
                # reference it
                _access_column_on_relation(
                    rightmost_table_alias,
                    jp.right_column,
                )
            )
        else:
            right_table = jp.right_table
            right_column_reference = jp.right_column
        left_table = from_clause
        left_column_reference = jp.left_column
        from_clause = join(
            left_table, right_table,
            left_column_reference == right_column_reference
        )
    # Here we produce the actual reference to the column we want to join in
    rightmost_table_target_column_reference = (
        _access_column_on_relation(
            rightmost_table_alias,
            target_sa_column,
        )
    )
    return from_clause, rightmost_table_target_column_reference


def _access_column_on_relation(relation, sa_column):
    column_name = sa_column.name
    return getattr(relation.c, column_name)
