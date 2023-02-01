from django.db import models
from frozendict import frozendict

from db.queries.base import DBQuery, InitialColumn, JoinParameter
from db.queries.operations.process import get_transforms_with_summarizes_speced
from db.transforms.operations.deserialize import deserialize_transformation
from db.transforms.operations.serialize import serialize_transformation
from db.transforms.base import Summarize
from db.functions.base import Count, ArrayAgg
from db.functions.packed import DistinctArrayAgg

from mathesar.api.exceptions.query_exceptions.exceptions import DeletedColumnAccess
from mathesar.models.validators import DictValidator, InitialColumnsValidator, ListOfDictValidator, TransformationsValidator
from mathesar.state.cached_property import cached_property
from mathesar.models.base import BaseModel, Column
from mathesar.models.relation import Relation
from mathesar.state import get_cached_metadata


class UIQuery(BaseModel, Relation):
    name = models.CharField(
        max_length=128,
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
            ListOfDictValidator(field_name="initial_columns"),
            InitialColumnsValidator(field_name="initial_columns"),
        ],
    )

    # sequence of dicts
    transformations = models.JSONField(
        null=True,
        blank=True,
        validators=[
            ListOfDictValidator(field_name="transformations"),
            TransformationsValidator(field_name="transformations"),
        ],
    )

    # dict of aliases to display options
    display_options = models.JSONField(
        null=True,
        blank=True,
        validators=[
            DictValidator(field_name="display_options"),
        ],
    )

    # dict of aliases to display names
    display_names = models.JSONField(
        null=True,
        blank=True,
        validators=[
            DictValidator(field_name="display_names"),
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
            input_table_id=None,
            input_alias=None,
        )
        output = output | optionals
        if is_initial_column:
            initial_dj_column = _get_dj_column_for_initial_db_column(initial_db_column, self._database)
            output = output | dict(
                input_column_name=initial_dj_column.name,
                input_table_name=initial_dj_column.table.name,
                input_table_id=initial_dj_column.table.id,
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
        # Try getting display options from this model's field
        if self.display_options:
            display_options = self.display_options.get(alias)
        # Try getting display options from Dj column, if this is an initial column
        if display_options is None:
            dj_col = self._map_of_initial_col_alias_to_dj_column.get(alias)
            if dj_col:
                display_options = dj_col.display_options
        # Try recursively repeating these steps for its parent alias, if it can be found
        if display_options is None:
            parent_alias = \
                self.db_query.map_of_output_alias_to_input_alias.get(alias)
            if parent_alias:
                display_options = self._get_display_options_for_alias(parent_alias)
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

    @property
    def _database(self):
        return self.base_table.schema.database

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


def _get_dj_column_for_initial_db_column(initial_column, database):
    oid = initial_column.reloid
    attnum = initial_column.attnum
    return Column.objects.get(
        table__oid=oid, attnum=attnum, table__schema__database=database
    )


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
        _join_parameter_from_json(jp_json)
        for jp_json
        in col_json.get("jp_path", [])
    ]
    return InitialColumn(
        reloid=reloid,
        attnum=attnum,
        alias=alias,
        jp_path=jp_path if jp_path else None,
    )


def _join_parameter_from_json(jp_json):
    left_col_id = jp_json[0]
    left_oid, left_attnum = _get_column_pair_from_id(left_col_id)
    right_col_id = jp_json[1]
    right_oid, right_attnum = _get_column_pair_from_id(right_col_id)
    return JoinParameter(
        left_oid=left_oid,
        left_attnum=left_attnum,
        right_oid=right_oid,
        right_attnum=right_attnum,
    )


def _get_default_display_name_for_agg_output_alias(
    output_alias,
    input_alias,
    agg_function,
    current_display_names,
):
    if output_alias and input_alias and agg_function:
        map_of_agg_function_to_suffix = {
            DistinctArrayAgg.id: " distinct list",
            ArrayAgg.id: " list",
            Count.id: " count",
        }
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
