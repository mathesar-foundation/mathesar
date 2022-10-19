from functools import wraps
from django.db import models
from django.utils.functional import cached_property

from db.queries.base import DBQuery, InitialColumn

from mathesar.models.base import BaseModel, Column
from mathesar.models.relation import Relation
from mathesar.api.exceptions.validation_exceptions.exceptions import InvalidValueType, DictHasBadKeys
from db.transforms.operations.deserialize import deserialize_transformation


def _get_validator_for_list_of_dicts(field_name):
    # NOTE `wraps` decorations needed to interop with Django's migrations
    @wraps(_get_validator_for_list_of_dicts)
    def _validator(value):
        if not isinstance(value, list):
            message = f"{value} should be a list."
            raise InvalidValueType(message, field=field_name)
        for subvalue in value:
            if not isinstance(subvalue, dict):
                message = f"{value} should contain only dicts."
                raise InvalidValueType(message, field=field_name)
    return _validator


def _get_validator_for_initial_columns(field_name):
    # NOTE `wraps` decorations needed to interop with Django's migrations
    @wraps(_get_validator_for_initial_columns)
    def _validator(initial_cols):
        for initial_col in initial_cols:
            keys = set(initial_col.keys())
            obligatory_keys = {
                "id",
                "alias",
            }
            missing_obligatory_keys = obligatory_keys.difference(keys)
            if missing_obligatory_keys:
                message = (
                    f"{initial_col} doesn't contain"
                    f" following obligatory keys: {missing_obligatory_keys}."
                )
                raise DictHasBadKeys(message, field=field_name)
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
                message = f"{initial_col} contains unexpected keys: {unexpected_keys}."
                raise DictHasBadKeys(message, field=field_name)
            jp_path = initial_col.get('jp_path')
            _get_validator_for_jp_path(field_name)(jp_path)
    return _validator


def _get_validator_for_jp_path(field_name):
    # NOTE `wraps` decorations needed to interop with Django's migrations
    @wraps(_get_validator_for_jp_path)
    def _validator(jp_path):
        if jp_path:
            if not isinstance(jp_path, list):
                message = f"jp_path must be a list, instead: {jp_path}."
                raise InvalidValueType(
                    message,
                    field=field_name,
                )
            for jp in jp_path:
                if not isinstance(jp, list):
                    message = f"jp_path elements must be 2-item lists, instead: {jp}."
                    raise InvalidValueType(
                        message,
                        field=field_name,
                    )
                for col_id in jp:
                    if not isinstance(col_id, int):
                        message = (
                            "jp_path elements must only contain integer column"
                            f" ids, instead: {jp}."
                        )
                        raise InvalidValueType(
                            message,
                            field=field_name,
                        )
    return _validator


def _get_validator_for_transformations(field_name):
    # NOTE `wraps` decorations needed to interop with Django's migrations
    @wraps(_get_validator_for_transformations)
    def _validator(transformations):
        for transformation in transformations:
            if "type" not in transformation:
                message = "Each 'transformations' sub-dict must have a 'type' key."
                raise DictHasBadKeys(message, field=field_name)
            if "spec" not in transformation:
                message = "Each 'transformations' sub-dict must have a 'spec' key."
                raise DictHasBadKeys(message, field=field_name)
    return _validator


def _get_validator_for_dict(field_name):
    # NOTE `wraps` decorations needed to interop with Django's migrations
    @wraps(_get_validator_for_dict)
    def _validator(value):
        if not isinstance(value, dict):
            message = f"{value} should be a dict."
            raise InvalidValueType(message, field=field_name)
    return _validator


class UIQuery(BaseModel, Relation):
    name = models.CharField(
        max_length=128,
        unique=True,
    )

    base_table = models.ForeignKey(
        'Table', on_delete=models.CASCADE, related_name='queries'
    )

    # sequence of dicts
    initial_columns = models.JSONField(
        validators=[
            _get_validator_for_list_of_dicts(field_name="initial_columns"),
            _get_validator_for_initial_columns(field_name="initial_columns"),
        ],
    )

    # sequence of dicts
    transformations = models.JSONField(
        null=True,
        blank=True,
        validators=[
            _get_validator_for_list_of_dicts(field_name="transformations"),
            _get_validator_for_transformations(field_name="transformations"),
        ],
    )

    # dict of column ids/aliases to display options
    display_options = models.JSONField(
        null=True,
        blank=True,
        validators=[
            _get_validator_for_dict(field_name="display_options"),
        ],
    )

    def get_records(self, **kwargs):
        return self.db_query.get_records(**kwargs)

    # TODO add engine from base_table.schema._sa_engine
    def sa_num_records(self, **kwargs):
        return self.db_query.get_count(**kwargs)

    @property
    def output_columns_described(self):
        """
        Returns columns' description, which is to be returned verbatim by the
        `queries/[id]/columns` endpoint.
        """
        return tuple(
            self._describe_query_column(sa_col)
            for sa_col
            in self.db_query.sa_output_columns
        )

    @property
    def output_columns_simple(self):
        return tuple(sa_col.name for sa_col in self.db_query.sa_output_columns)

    @property
    def initial_dj_columns(self):
        return Column.objects.filter(pk__in=[col['id'] for col in self.initial_columns])

    @property
    def initial_columns_described(self):
        return tuple(
            {
                'alias': col['alias'],
                'display_name': col.get('display_name')
            }
            | {
                'type': dj_col.db_type.id,
                'type_options': dj_col._sa_column.type_options,
                'display_options': dj_col.display_options
            }
            for col, dj_col in zip(self.initial_columns, self.initial_dj_columns)
        )

    def _describe_query_column(self, sa_col):
        return {
            'alias': sa_col.name,
            'display_name': self._get_display_name_for_sa_col(sa_col),
            'type': sa_col.db_type.id,
            'type_options': sa_col.type_options,
            'display_options': self._get_display_options_for_sa_col(sa_col),
        }

    @property
    def all_columns_description_map(self):
        return {
            alias: self._describe_query_column(sa_col)
            for alias, sa_col in self.db_query.all_sa_columns_map.items()
        }

    @property
    def db_query(self):
        return DBQuery(
            base_table_oid=self.base_table.oid,
            initial_columns=self._db_initial_columns,
            engine=self._sa_engine,
            transformations=self._db_transformations,
            name=self.name,
        )

    @property
    def _db_initial_columns(self):
        self._prefetch_query_column_objs(self.initial_columns)
        return tuple(
            _db_initial_column_from_json(json_col)
            for json_col in self.initial_columns
        )

    def _prefetch_query_column_objs(self, initial_columns_json):
        column_ids_to_prefetch = set()
        for json_col in initial_columns_json:
            column_ids_to_prefetch.add(json_col["id"])
            for edge in json_col.get("jp_path", []):
                column_ids_to_prefetch.update(edge)
        prefetched_columns = Column.objects.filter(id__in=column_ids_to_prefetch).select_related('table')
        prefetched_columns_map = {col.id: col for col in prefetched_columns}
        return prefetched_columns_map

    @property
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
        display_name_map = {
            initial_column['alias']: initial_column.get('display_name')
            for initial_column
            in self.initial_columns
        }
        if self.transformations is not None:
            display_name_map.update(
                {
                    k: v
                    for transformation in self.transformations
                    for k, v in transformation.get('display_names', {}).items()
                }
            )
        return display_name_map

    @property
    def _sa_engine(self):
        return self.base_table._sa_engine


def _get_column_pair_from_id(col_id):
    col = Column.objects.get(id=col_id)
    return col.table.oid, col.attnum


def _db_initial_column_from_json(col_json):
    column_pair = _get_column_pair_from_id(col_json["id"])
    reloid = column_pair[0]
    attnum = column_pair[1]
    alias = col_json["alias"]
    jp_path = [
        [_get_column_pair_from_id(col_id) for col_id in edge]
        for edge in col_json.get("jp_path", [])
    ]
    return InitialColumn(
        reloid=reloid,
        attnum=attnum,
        alias=alias,
        jp_path=jp_path if jp_path else None,
    )
