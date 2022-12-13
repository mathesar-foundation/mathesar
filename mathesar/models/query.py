from functools import wraps
from django.db import models
from frozendict import frozendict

from db.queries.base import DBQuery, InitialColumn
from db.queries.operations.process import get_transforms_with_summarizes_speced
from db.transforms.operations.deserialize import deserialize_transformation
from db.transforms.operations.serialize import serialize_transformation
from db.transforms.base import Summarize

from mathesar.api.exceptions.query_exceptions.exceptions import DeletedColumnAccess
from mathesar.state.cached_property import cached_property
from mathesar.models.base import BaseModel, Column
from mathesar.models.relation import Relation
from mathesar.api.exceptions.validation_exceptions.exceptions import InvalidValueType, DictHasBadKeys
from mathesar.state import get_cached_metadata


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

    description = models.TextField(
        null=True,
        blank=True
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

    # dict of aliases to display options
    display_options = models.JSONField(
        null=True,
        blank=True,
        validators=[
            _get_validator_for_dict(field_name="display_options"),
        ],
    )

    # dict of aliases to display names
    display_names = models.JSONField(
        null=True,
        blank=True,
        validators=[
            _get_validator_for_dict(field_name="display_names"),
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
    def initial_columns_described(self):
        return tuple(
            {
                'alias': initial_col_alias,
                'display_name': self._get_display_name_for_alias(
                    initial_col_alias
                ),
                'type': dj_col.db_type.id,
                'type_options': dj_col._sa_column.type_options,
                'display_options': dj_col.display_options
            }
            for initial_col_alias, dj_col
            in self._map_of_initial_col_alias_to_dj_column.items()
        )

    def _describe_query_column(self, sa_col):
        """
        Note, has some conditional fields depending on whether the column is an initial column or
        is generated mid-query (created via a summarization).
        """
        alias = sa_col.name
        initial_db_column = self._get_db_initial_column_by_alias(alias)
        is_initial_column = initial_db_column is not None
        output = dict(
            alias=alias,
            display_name=self._get_display_name_for_alias(alias),
            type=sa_col.db_type.id,
            type_options=sa_col.type_options,
            display_options=self._get_display_options_for_alias(alias),
            is_initial_column=is_initial_column,
        )
        optionals = dict(
            input_column_name=None,
            input_table_name=None,
            input_alias=None,
        )
        output = output | optionals
        if is_initial_column:
            initial_dj_column = _get_dj_column_for_initial_db_column(initial_db_column)
            output = output | dict(
                input_column_name=initial_dj_column.name,
                input_table_name=initial_dj_column.table.name,
            )
        else:
            input_alias = self.db_query.get_input_alias_for_output_alias(alias)
            output = output | dict(
                input_alias=input_alias
            )
        return output

    def _get_db_initial_column_by_alias(self, alias):
        for db_initial_column in self._db_initial_columns:
            if db_initial_column.alias == alias:
                return db_initial_column

    @property
    def all_columns_description_map(self):
        return {
            alias: self._describe_query_column(sa_col)
            for alias, sa_col in self.db_query.all_sa_columns_map.items()
        }

    def replace_transformations_with_processed_transformations(self):
        """
        The transformations attribute is normally specified via a HTTP request. Now we're
        introducing the concept of processed transformations, where we look at the
        transformations and we find transformations that may be partially specified, if any, and
        replace them with transformations resulting from processing them. The frontend then
        reflects our updated transformations.

        We're keeping this functionality somewhat separate from the default/simpler transformation
        pipeline. Meaning that it is not enabled by default and has to be triggered on demand (by
        calling this method). That is for multiple reasons.

        Whereas before the transformations attribute was a one-way flow from the client,
        now it's something that the backend may redefine. This a significant complication of the
        data flow. For example, if you replace transformations on a saved UIQuery and save it
        again, we must trigger a reflection, which can have a performance impact. Also, frontend
        must expect that certain transformations might alter the transformation pipeline, which
        would then need reflecting by frontend; that might be a breaking change.

        Note, currently we only need transformation processing when using the `query/run`
        endpoint, which means that we don't need to update any persisted queries, which means that
        we don't need to trigger reflection.
        """
        self.transformations = self._processed_transformations

    @property
    def _processed_transformations(self):
        return tuple(
            serialize_transformation(db_transformation)
            for db_transformation
            in self._processed_db_transformations
        )

    @property
    def _processed_db_transformations(self):
        """
        Currently, the only transformation processing we're doing is finishing (when partial) the
        specification of Summarize transforms.

        Note, different from _db_transformations, because this can effectively rewrite the
        transformations pipeline. And we might not want to do that every time db_transformations
        is accessed, due to possible performance costs.

        If it weren't for performance costs, we might consider replacing _db_transformations with
        this: the effect would be that a persisted query could have different summarizations in
        django database than what is being evaluated in Postgres.
        """
        return get_transforms_with_summarizes_speced(
            db_query=self.db_query,
            engine=self._sa_engine,
            metadata=get_cached_metadata(),
        )

    @property
    def db_query(self):
        return DBQuery(
            base_table_oid=self.base_table.oid,
            initial_columns=self._db_initial_columns,
            engine=self._sa_engine,
            transformations=self._db_transformations,
            name=self.name,
            metadata=get_cached_metadata()
        )

    # TODO reused; consider using cached_property
    @property
    def _db_initial_columns(self):
        return tuple(
            _db_initial_column_from_json(json_col)
            for json_col in self.initial_columns
        )

    @property
    def _db_transformations(self):
        """No processing necessary."""
        if self.transformations:
            return tuple(
                deserialize_transformation(json)
                for json
                in self.transformations
            )

    def _get_display_name_for_alias(self, alias):
        return self._alias_to_display_name.get(alias)

    def _get_display_options_for_alias(self, alias):
        display_options = None
        if self.display_options:
            display_options = self.display_options.get(alias)
        if display_options is None:
            # notice that this isn't meant to support non-initial-column aliases
            dj_col = self._map_of_initial_col_alias_to_dj_column.get(alias)
            if dj_col:
                display_options = dj_col.display_options
        return display_options

    @cached_property
    def _alias_to_display_name(self):
        alias_to_display_name = {}
        if self.display_names is not None:
            alias_to_display_name.update(self.display_names)
        return alias_to_display_name

    @property
    def _sa_engine(self):
        return self.base_table._sa_engine

    def add_defaults_to_display_names(self):
        """
        We have some logic for producing default display names. This method fetches those default
        display names and merges them with previously-stored display names. Previously-stored
        display names take precedence.
        """
        current_display_names = self.display_names or dict()
        self.display_names = self._default_display_names | current_display_names

    @property
    def _default_display_names(self):
        """
        Returns default display options for initial columns merged with default display options for
        summarizations. Does not return current display names (as stored in the `display_names`
        attribute), though they are used when generating some of the default display names.
        """
        current_display_names = self.display_names or dict()
        default_display_names_for_initial_columns = self._default_display_names_for_initial_columns
        current_display_names = \
            default_display_names_for_initial_columns \
            | current_display_names
        default_display_names_for_summarize_transforms = \
            self._get_default_display_names_for_summarize_transforms(
                current_display_names
            )
        default_display_names = \
            default_display_names_for_summarize_transforms \
            | default_display_names_for_initial_columns
        return default_display_names

    @property
    def _default_display_names_for_initial_columns(self):
        return {
            alias: dj_col.name
            for alias, dj_col
            in self._map_of_initial_col_alias_to_dj_column.items()
        }

    def _get_default_display_names_for_summarize_transforms(self, current_display_names):
        default_display_names = dict()
        if not current_display_names:
            return default_display_names
        summarize_transforms = [
            db_transform
            for db_transform
            in self.db_query.transformations
            if isinstance(db_transform, Summarize)
        ]
        for summarize_transform in summarize_transforms:
            # Find default display names for grouping output aliases
            for output_alias in summarize_transform.grouping_output_aliases:
                default_display_name = \
                    _get_default_display_name_for_group_output_alias(
                        summarize_transform,
                        output_alias,
                        current_display_names,
                    )
                if default_display_name:
                    default_display_names[output_alias] = default_display_name
            # Find default display names for aggregation output aliases
            for agg_col_spec in summarize_transform.aggregation_col_specs:
                input_alias = agg_col_spec.get("input_alias")
                output_alias = agg_col_spec.get("output_alias")
                agg_function = agg_col_spec.get("function")
                default_display_name = \
                    _get_default_display_name_for_agg_output_alias(
                        output_alias,
                        input_alias,
                        agg_function,
                        current_display_names,
                    )
                if default_display_name:
                    default_display_names[output_alias] = default_display_name
        return default_display_names

    @property
    def _map_of_initial_col_alias_to_dj_column(self):
        dj_column_ids = [col['id'] for col in self.initial_columns]
        dj_columns = Column.objects.filter(pk__in=dj_column_ids)
        initial_col_aliases = [
            initial_col['alias']
            for initial_col
            in self.initial_columns
        ]
        return frozendict(
            zip(
                initial_col_aliases,
                dj_columns,
            )
        )


def _get_dj_column_for_initial_db_column(initial_column):
    oid = initial_column.reloid
    attnum = initial_column.attnum
    return Column.objects.get(table__oid=oid, attnum=attnum)


def _get_column_pair_from_id(col_id):
    try:
        col = Column.objects.get(id=col_id)
    except Column.DoesNotExist:
        raise DeletedColumnAccess(col_id)
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


def _get_default_display_name_for_agg_output_alias(
    output_alias,
    input_alias,
    agg_function,
    current_display_names,
):
    if output_alias and input_alias and agg_function:
        map_of_agg_function_to_suffix = dict(
            aggregate_to_array=" list",
            count=" count",
        )
        suffix_to_add = map_of_agg_function_to_suffix.get(agg_function)
        if suffix_to_add:
            input_alias_display_name = current_display_names.get(input_alias)
            if input_alias_display_name:
                return input_alias_display_name + suffix_to_add


def _get_default_display_name_for_group_output_alias(
    summarize_transform,
    output_alias,
    current_display_names,
):
    input_alias = \
        summarize_transform\
        .map_of_output_alias_to_input_alias[output_alias]
    input_alias_display_name = current_display_names.get(input_alias)
    if input_alias_display_name:
        suffix_to_add = " group"
        return input_alias_display_name + suffix_to_add
