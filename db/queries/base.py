from collections import namedtuple

from sqlalchemy import select, join

from django.utils.functional import cached_property

from db.columns.base import MathesarColumn


class DBQuery:
    def __init__(
        self,
        base_table,
        initial_columns,
        transformations=None,
        name=None
    ):
        self.base_table = base_table
        self.initial_columns = initial_columns
        self.transformations = transformations
        self.name = name
        return self

    def get_records(self):
        pass

    @cached_property
    def sa_output_columns(self):
        """
        Sequence of SQLAlchemy columns representing the output columns of the relation described
        by this query.
        """
        regular_sa_columns = self.sa_relation.columns
        enriched_sa_columns = tuple(MathesarColumn.from_column(col) for col in regular_sa_columns)
        return enriched_sa_columns

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
        column,
        jp_path=None,
    ):
        if jp_path is not None:
            for jp in jp_path:
                assert isinstance(jp, JoinParams)
        self.jp_path = jp_path
        assert isinstance(column, MathesarColumn)
        self.column = column
        return self


class JoinParams(
    namedtuple(
        'JoinParams',
        [
            'left_table',
            'right_table',
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
            left_table=self.right_table,
            right_table=self.left_table,
            left_column=self.right_column,
            right_column=self.left_column,
        )


def _apply_transformations(initial_relation, transformations):
    return initial_relation


def _get_initial_relation(query):
    nested_join = None
    sa_columns_to_select = []
    for initial_column in query.initial_columns:
        nested_join, sa_column_to_select = _process_initial_column(
            initial_column=initial_column,
            nested_join=nested_join,
        )
        sa_columns_to_select.append(sa_column_to_select)

    select_target = nested_join or query.sa_base_table
    stmt = select(*sa_columns_to_select).select_from(select_target)
    return stmt


def _process_initial_column(initial_column, nested_join):
    if _is_base_column(initial_column):
        col_to_select = initial_column.column
    else:
        nested_join, col_to_select = _nest_a_join(
            initial_column=initial_column,
            nested_join=nested_join,
        )
    # Give an alias/label to this column, since that's how it will be referenced in transforms.
    aliased_col_to_select = col_to_select.label(initial_column.alias)
    return nested_join, aliased_col_to_select


def _nest_a_join(nested_join, initial_column):
    jp_path = initial_column.jp_path
    target_sa_column = initial_column.column
    rightmost_table_alias = None
    for i, jp in enumerate(reversed(jp_path)):
        is_last_jp = i == 0
        if is_last_jp:
            rightmost_table_alias = jp.right_table.alias()
            right_table = rightmost_table_alias
        else:
            right_table = nested_join

        nested_join = join(
            jp.left_table, right_table,
            jp.left_column == jp.right_column
        )
    sa_col_to_select = _access_column_on_aliased_relation(
        rightmost_table_alias,
        target_sa_column,
    )
    return nested_join, sa_col_to_select


def _access_column_on_aliased_relation(aliased_relation, sa_column):
    column_name = sa_column.name
    return getattr(aliased_relation.c, column_name)


def _is_base_column(initial_column):
    return initial_column.jp_path is not None
