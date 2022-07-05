from django.db import models
from django.utils.functional import cached_property

from db.queries.base import DBQuery, JoinParams, InitialColumn

from mathesar.models.base import BaseModel, Column, Table
from mathesar.models.relation import Relation


class UIQuery(BaseModel, Relation):
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
    display_options = models.JSONField(
        null=True,
        blank=True,
    )

    # TODO add engine from base_table.schema._sa_engine
    def get_records(self, **kwargs):
        return self.db_query.get_records(
            engine=self._sa_engine,
            **kwargs,
        )

    # TODO add engine from base_table.schema._sa_engine
    def sa_num_records(self, **kwargs):
        return self.db_query.get_count(
            engine=self._sa_engine,
            **kwargs,
        )

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
            in self.db_query.sa_output_columns
        )

    @cached_property
    def db_query(self):
        return DBQuery(
            base_table=self.base_table._sa_table,
            initial_columns=self._db_initial_columns,
            transformations=self._db_transformations,
            name=self.name,
        )

    @cached_property
    def _db_initial_columns(self):
        return tuple(
            _db_initial_column_from_json(json_initial_column)
            for json_initial_column
            in self.initial_columns
        )

    @cached_property
    def _db_transformations(self):
        return

    def _get_display_options_for_sa_col(self, sa_col):
        if self.display_options is not None:
            return self.display_options.get(sa_col.name)

    @property
    def _sa_engine(self):
        return self.base_table._sa_engine


def _db_initial_column_from_json(json):
    alias = json['alias']
    sa_column = _get_sa_col_by_id(json['id'])
    json_jp_path = json.get('jp_path')
    if json_jp_path:
        jp_path = tuple(
            join_params_from_json(json_jp)
            for json_jp
            in json_jp_path
        )
    else:
        jp_path = None
    return InitialColumn(
        column=sa_column,
        jp_path=jp_path,
        alias=alias,
    )


def join_params_from_json(json_jp):
    return JoinParams(
        left_table=_get_sa_table_by_id(json_jp[0][0]),
        right_table=_get_sa_table_by_id(json_jp[1][0]),
        left_column=_get_sa_col_by_id(json_jp[0][1]),
        right_column=_get_sa_col_by_id(json_jp[1][1]),
    )


def _get_sa_col_by_id(dj_id):
    return Column.objects.get(pk=dj_id)._sa_column


def _get_sa_table_by_id(dj_id):
    return Table.objects.get(pk=dj_id)._sa_table
