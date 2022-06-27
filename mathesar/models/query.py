from collections import namedtuple

from sqlalchemy import select, join

from django.db import models
from django.utils.functional import cached_property

from db.columns.base import MathesarColumn

from mathesar.models.base import BaseModel, Column


class Query(BaseModel):
    name = models.CharField(
        max_length=128,
        unique=True,
        null=True,
        blank=True,
    )
    base_table = models.ForeignKey('Table', on_delete=models.CASCADE)

    # sequence of dicts
    initial_columns = models.JSONField()

    # sequence of dicts
    transformations = models.JSONField(
        null=True,
        blank=True,
    )

    # dict of column ids/aliases to display options
    display_options = models.JSONField()

    @cached_property
    def sa_relation(self):
        """
        A query describes a relation. This property is the result of parsing a query into a
        relation.
        """
        initial_relation = _get_initial_relation(self)
        transformed = _apply_transformations(initial_relation, self.transformations)
        return transformed

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
    def get_output_columns_described(self):
        """
        Returns columns' description, which is to be returned verbatim by the
        `queries/[id]/columns` endpoint.
        """
        return tuple(
            {
                'name': None,
                'alias': sa_col.name,
                'type': sa_col.db_type.id,
                'type_options': sa_col.type_options,
                'display_options': self._get_display_options_for_sa_col(sa_col),
            }
            for sa_col
            in self.sa_output_columns
        )

    def _get_display_options_for_sa_col(self, sa_col):
        if self.display_options is not None:
            return self.display_options.get(sa_col.name)

    def get_records(self):
        pass

    @cached_property
    def sa_base_table(self):
        pass


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

    def flip(self):
        return JoinParams(
            left_table=self.right_table,
            right_table=self.left_table,
            left_column=self.right_column,
            right_column=self.left_column,
        )

    @staticmethod
    def from_json(json):
        return JoinParams(
            left_table=json['left_table'],
            right_table=json['foreign_table'],
            left_column=json['native_column'],
            right_column=json['foreign_column'],
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
        col_to_select = _get_sa_col_from_initial_col(initial_column)
    else:
        jp_path = _get_jp_path(initial_column)

        target_sa_column = _get_sa_col_from_initial_col(initial_column)
        nested_join, col_to_select = _process_jp_path(
            jp_path=jp_path,
            nested_join=nested_join,
            target_sa_column=target_sa_column,
        )
    # Give an alias/label to this column, since that's how it will be referenced in transforms.
    aliased_col_to_select = col_to_select.label(initial_column.alias)
    return nested_join, aliased_col_to_select


def _process_jp_path(jp_path, nested_join, target_sa_column):
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


def _get_sa_col_from_initial_col(initial_column):
    dj_id = _get_initial_column_id(initial_column)
    return Column.objects.get(pk=dj_id)._sa_column


def _get_jp_path(initial_column):
    json = initial_column['jp_path']
    return JoinParams.from_json(json)


def _get_initial_column_id(initial_column):
    return initial_column['id']


def _is_base_column(initial_column):
    return _get_jp_path(initial_column) is not None
