from django.db import models
from django.utils.functional import cached_property

from db.queries.base import DBQuery, JoinParams, InitialColumn

from mathesar.models.base import BaseModel, Column, Table
from mathesar.models.relation import Relation
from django.core.exceptions import ValidationError
from db.transforms.operations.deserialize import deserialize_transformation


def _validate_list_of_dicts(value):
    if not isinstance(value, list):
        raise ValidationError(f"{value} should be a list.")
    for subvalue in value:
        if not isinstance(subvalue, dict):
            raise ValidationError(f"{value} should contain only dicts.")


def _validate_initial_columns(initial_cols):
    for initial_col in initial_cols:
        keys = set(initial_col.keys())
        obligatory_keys = {
            "id",
            "alias",
        }
        missing_obligatory_keys = obligatory_keys.difference(keys)
        if missing_obligatory_keys:
            raise ValidationError(
                f"{initial_col} doesn't contain"
                f" following obligatory keys: {missing_obligatory_keys}."
            )
        optional_keys = {
            "display_name",
            "jp_path",
        }
        valid_keys = {
            *obligatory_keys,
            *optional_keys,
        }
        unexpected_keys = keys.difference(valid_keys)
        if unexpected_keys:
            raise ValidationError(
                f"{initial_col} contains unexpected keys: {unexpected_keys}."
            )
        jp_path = initial_col.get('jp_path')
        _validate_jp_path(jp_path)


def _validate_jp_path(jp_path):
    if jp_path:
        if not isinstance(jp_path, list):
            raise ValidationError(
                f"jp_path must be a list, instead: {jp_path}."
            )
        for jp in jp_path:
            if not isinstance(jp, list):
                raise ValidationError(
                    f"jp_path elements must be 2-item lists, instead: {jp}."
                )
            for col_id in jp:
                if not isinstance(col_id, int):
                    raise ValidationError(
                        "jp_path elements must only contain integer column"
                        f" ids, instead: {jp}."
                    )


def _validate_transformations(transformations):
    for transformation in transformations:
        if "type" not in transformation:
            raise ValidationError("Each 'transformations' sub-dict must have a 'type' key.")
        if "spec" not in transformation:
            raise ValidationError("Each 'transformations' sub-dict must have a 'spec' key.")


def _validate_dict(value):
    if not isinstance(value, dict):
        raise ValidationError(f"{value} should be a dict.")


class UIQuery(BaseModel, Relation):
    name = models.CharField(
        max_length=128,
        unique=True,
    )

    base_table = models.ForeignKey(
        'Table', on_delete=models.CASCADE,
    )

    # sequence of dicts
    initial_columns = models.JSONField(
        null=True,
        blank=True,
        validators=[_validate_list_of_dicts, _validate_initial_columns],
    )

    # sequence of dicts
    transformations = models.JSONField(
        null=True,
        blank=True,
        validators=[_validate_list_of_dicts, _validate_transformations],
    )

    # dict of column ids/aliases to display options
    display_options = models.JSONField(
        null=True,
        blank=True,
        validators=[_validate_dict],
    )

    __table_cache = {}

    @property
    def not_partial(self):
        return (
            (self.base_table is not None)
            and (self.initial_columns is not None)
        )

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
    def output_columns_described(self):
        """
        Returns columns' description, which is to be returned verbatim by the
        `queries/[id]/columns` endpoint.
        """
        return tuple(
            {
                'alias': sa_col.name,
                'display_name': self._get_display_name_for_sa_col(sa_col),
                'type': sa_col.db_type.id,
                'type_options': sa_col.type_options,
                'display_options': self._get_display_options_for_sa_col(sa_col),
            }
            for sa_col
            in self.db_query.sa_output_columns(engine=self._sa_engine)
        )

    @cached_property
    def db_query(self):
        unique_base_table = _make_sure_table_is_unique(
            self._table_cache,
            self.base_table._sa_table,
        )
        return DBQuery(
            base_table=unique_base_table,
            initial_columns=self._db_initial_columns,
            transformations=self._db_transformations,
            name=self.name,
        )

    @cached_property
    def _db_initial_columns(self):
        return tuple(
            _db_initial_column_from_json(self._table_cache, json_initial_column)
            for json_initial_column
            in self.initial_columns
        )

    @cached_property
    def _db_transformations(self):
        """No processing necessary."""
        if self.transformations:
            return tuple(
                deserialize_transformation(json)
                for json
                in self.transformations
            )

    def _get_display_name_for_sa_col(self, sa_col):
        return self._alias_to_display_name.get(sa_col.name)

    def _get_display_options_for_sa_col(self, sa_col):
        if self.display_options is not None:
            return self.display_options.get(sa_col.name)

    @cached_property
    def _alias_to_display_name(self):
        return {
            initial_column['alias']: initial_column['display_name']
            for initial_column
            in self.initial_columns
            if 'display_name' in initial_column
        }

    @property
    def _sa_engine(self):
        return self.base_table._sa_engine

    @property
    def _table_cache(self):
        """
        Note the use of a UIQuery-wide _table_cache. Its purpose is that every Postgres-unique table
        should only have a single SQLAlchemy Table when constructing a query. This is necessary,
        because SQLAlchemy currently does not recognize duplicate SA Tables as such, and, for
        example, can put the same table in the FROM clause multiple times.
        """
        return self.__table_cache

    @_table_cache.deleter
    def _table_cache(self):
        self.__table_cache = {}


def _db_initial_column_from_json(table_cache, json):
    alias = json['alias']
    sa_column = _get_sa_col_by_id(table_cache, json['id'])
    json_jp_path = json.get('jp_path')
    if json_jp_path:
        jp_path = tuple(
            _join_params_from_json(table_cache, json_jp)
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


def _join_params_from_json(table_cache, json_jp):
    return JoinParams(
        left_column=_get_sa_col_by_id(table_cache, json_jp[0]),
        right_column=_get_sa_col_by_id(table_cache, json_jp[1]),
    )


def _get_sa_col_by_id(table_cache, dj_id):
    """
    Note that we have to do some shuffling with 2 goals:

    1. reduce a MathesarColumn (enriched_column) to SA Column (regular_column), otherwise SA's
    joining mechanism throws errors;
    2. cache tables associated with columns so that there's only a single SA table for a referenced
    Postgres table, otherwise SA produces invalid SQL with duplicate tables in the FROM clause.
    """
    dj_column = Column.objects.get(pk=dj_id)
    enriched_column = dj_column._sa_column
    regular_column = enriched_column.to_sa_column()
    final_column = _make_sure_column_has_unique_table(
        table_cache,
        regular_column,
    )
    return final_column


def _make_sure_column_has_unique_table(table_cache, column):
    assert isinstance(table_cache, dict)
    table = column.table
    unique_table = _make_sure_table_is_unique(table_cache, table)
    column.table = unique_table
    return column


def _make_sure_table_is_unique(table_cache, table):
    assert table is not None
    schema_name = table.schema
    assert schema_name is not None
    cached_table = table_cache.setdefault((schema_name, table.name), table)
    return cached_table


def _get_sa_table_by_id(dj_id):
    return Table.objects.get(pk=dj_id)._sa_table
