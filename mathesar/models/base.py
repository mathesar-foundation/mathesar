from functools import reduce

from bidict import bidict

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import JSONField

from db.columns import utils as column_utils
from db.columns.operations.create import create_column, duplicate_column
from db.columns.operations.alter import alter_column
from db.columns.operations.drop import drop_column
from db.columns.operations.select import (
    get_column_attnum_from_names_as_map, get_column_name_from_attnum,
    get_map_of_attnum_to_column_name, get_map_of_attnum_and_table_oid_to_column_name,
)
from db.constraints.operations.create import create_constraint
from db.constraints.operations.drop import drop_constraint
from db.constraints.operations.select import (
    get_constraint_oid_by_name_and_table_oid, get_constraint_record_from_oid
)
from db.constraints import utils as constraint_utils
from db.dependents.dependents_utils import get_dependents_graph, has_dependents
from db.records.operations.delete import delete_record
from db.records.operations.insert import insert_record_or_records
from db.records.operations.select import get_column_cast_records, get_count, get_record
from db.records.operations.select import get_records_with_default_order as db_get_records_with_default_order
from db.records.operations.update import update_record
from db.schemas.operations.drop import drop_schema
from db.schemas.operations.select import get_schema_description
from db.schemas import utils as schema_utils
from db.tables import utils as table_utils
from db.tables.operations.drop import drop_table
from db.tables.operations.move_columns import move_columns_between_related_tables
from db.tables.operations.select import (
    get_oid_from_table,
    reflect_table_from_oid,
    get_table_description,
    reflect_tables_from_oids
)
from db.tables.operations.split import extract_columns_from_table
from db.records.operations.insert import insert_from_select
from db.tables.utils import get_primary_key_column

from mathesar.models.relation import Relation
from mathesar.utils import models as model_utils
from mathesar.utils.prefetch import PrefetchManager, Prefetcher
from mathesar.database.base import create_mathesar_engine
from mathesar.database.types import UIType, get_ui_type_from_db_type
from mathesar.state import make_sure_initial_reflection_happened, get_cached_metadata, reset_reflection
from mathesar.state.cached_property import cached_property
from mathesar.api.exceptions.database_exceptions.base_exceptions import ProgrammingAPIException


NAME_CACHE_INTERVAL = 60 * 5


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DatabaseObjectManager(PrefetchManager):
    def get_queryset(self):
        make_sure_initial_reflection_happened()
        return super().get_queryset()


class ReflectionManagerMixin(models.Model):
    """
    Used to reflect objects that exists on the user database but does not have a equivalent mathesar reference object.
    """
    # The default manager, current_objects, does not reflect database objects.
    # This saves us from having to deal with Django trying to automatically reflect db
    # objects in the background when we might not expect it.
    current_objects = models.Manager()
    objects = DatabaseObjectManager()

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}"


class DatabaseObject(ReflectionManagerMixin, BaseModel):
    """
    Objects that can be referenced using a database identifier
    """
    oid = models.IntegerField()

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}: {self.oid}"

    def __repr__(self):
        return f'<{self.__class__.__name__}: {self.oid}>'


# TODO: Replace with a proper form of caching
# See: https://github.com/centerofci/mathesar/issues/280
_engine_cache = {}


class Database(ReflectionManagerMixin, BaseModel):
    current_objects = models.Manager()
    # TODO does this need to be defined, given that ReflectionManagerMixin defines an identical attribute?
    objects = DatabaseObjectManager()
    name = models.CharField(max_length=128, unique=True)
    deleted = models.BooleanField(blank=True, default=False)

    @property
    def _sa_engine(self):
        global _engine_cache
        # We're caching this since the engine is used frequently.
        db_name = self.name
        was_cached = db_name in _engine_cache
        if was_cached:
            engine = _engine_cache.get(db_name)
            model_utils.ensure_cached_engine_ready(engine)
        else:
            engine = create_mathesar_engine(db_name=db_name)
            _engine_cache[db_name] = engine
        return engine

    @property
    def supported_ui_types(self):
        """
        At the moment we don't actually filter our UIType set based on whether or not a UIType's
        constituent DB types are supported.
        """
        return UIType

    def __repr__(self):
        return f'{self.__class__.__name__}: {self.name}, {self.id}'


class Schema(DatabaseObject):
    database = models.ForeignKey('Database', on_delete=models.CASCADE,
                                 related_name='schemas')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["oid", "database"], name="unique_schema")
        ]

    @property
    def _sa_engine(self):
        return self.database._sa_engine

    @property
    def name(self):
        cache_key = f"{self.database.name}_schema_name_{self.oid}"
        try:
            schema_name = cache.get(cache_key)
            if schema_name is None:
                schema_name = schema_utils.get_schema_name_from_oid(
                    self.oid, self._sa_engine
                )
                cache.set(cache_key, schema_name, NAME_CACHE_INTERVAL)
            return schema_name
        # We catch this error, since it lets us decouple the cadence of
        # overall DB reflection from the cadence of cache expiration for
        # schema names.  Also, it makes it obvious when the DB layer has
        # been altered, as opposed to other reasons for a 404 when
        # requesting a schema.
        except TypeError:
            return 'MISSING'

    @property
    def has_dependents(self):
        return has_dependents(
            self.oid,
            self._sa_engine
        )

    # Returns only schema-scoped dependents on the top level
    # However, returns dependents from other schemas for other
    # objects down the graph.
    # E.g: TableA from SchemaA depends on TableB from SchemaB
    # SchemaA won't return as a dependent for SchemaB, however
    # TableA will be a dependent of TableB which in turn depends on its schema
    def get_dependents(self, exclude=[]):
        return get_dependents_graph(
            self.oid,
            self._sa_engine,
            exclude
        )

    @property
    def description(self):
        return get_schema_description(self.oid, self._sa_engine)

    def update_sa_schema(self, update_params):
        result = model_utils.update_sa_schema(self, update_params)
        reset_reflection()
        return result

    def delete_sa_schema(self):
        result = drop_schema(self.name, self._sa_engine, cascade=True)
        reset_reflection()
        return result

    def clear_name_cache(self):
        cache_key = f"{self.database.name}_schema_name_{self.oid}"
        cache.delete(cache_key)


class ColumnNamePrefetcher(Prefetcher):
    def filter(self, column_attnums, columns):
        if len(columns) < 1:
            return []
        table = list(columns)[0].table
        return get_map_of_attnum_to_column_name(
            table.oid,
            column_attnums,
            table._sa_engine,
            metadata=get_cached_metadata(),
        )

    def mapper(self, column):
        return column.attnum

    def reverse_mapper(self, column):
        # We return maps mostly, so a reverse mapper is not needed
        pass

    def decorator(self, column, name):
        setattr(column, 'name', name)


class ColumnPrefetcher(Prefetcher):
    def filter(self, table_ids, tables):
        if len(tables) < 1:
            return []
        columns = reduce(lambda column_objs, table: column_objs + list(table.columns.all()), tables, [])
        table_oids = [table.oid for table in tables]

        def _get_column_names_from_tables(table_oids):
            if len(tables) > 0:
                engine = list(tables)[0]._sa_engine
            else:
                return []
            return get_map_of_attnum_and_table_oid_to_column_name(
                table_oids,
                engine=engine,
                metadata=get_cached_metadata(),
            )
        return ColumnNamePrefetcher(
            filter=lambda column_attnums, columns: _get_column_names_from_tables(table_oids),
            mapper=lambda column: (column.attnum, column.table.oid)
        ).fetch(columns, 'columns__name', Column, [])

    def reverse_mapper(self, column):
        return [column.table_id]

    def decorator(self, table, columns):
        pass


_sa_table_prefetcher = Prefetcher(
    filter=lambda oids, tables: reflect_tables_from_oids(
        oids, list(tables)[0]._sa_engine, metadata=get_cached_metadata()
    ) if len(tables) > 0 else [],
    mapper=lambda table: table.oid,
    # A filler statement, just used to satisfy the library. It does not affect the prefetcher in
    # any way as we bypass reverse mapping if the prefetcher returns a dictionary
    reverse_mapper=lambda table: table.oid,
    decorator=lambda table, _sa_table: setattr(
        table,
        '_sa_table',
        _sa_table
    )
)


class Table(DatabaseObject, Relation):
    # These are fields whose source of truth is in the model
    MODEL_FIELDS = ['import_verified']
    current_objects = models.Manager()
    objects = DatabaseObjectManager(
        # TODO Move the Prefetcher into a separate class and replace lambdas with proper function
        _sa_table=_sa_table_prefetcher,
        columns=ColumnPrefetcher,
    )
    schema = models.ForeignKey('Schema', on_delete=models.CASCADE,
                               related_name='tables')
    import_verified = models.BooleanField(blank=True, null=True)
    import_target = models.ForeignKey('Table', blank=True, null=True, on_delete=models.SET_NULL)
    is_temp = models.BooleanField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["oid", "schema"], name="unique_table")
        ]

    def validate_unique(self, exclude=None):
        # Ensure oid is unique on db level
        if Table.current_objects.filter(
            oid=self.oid, schema__database=self.schema.database
        ).exists():
            raise ValidationError("Table OID is not unique")
        super().validate_unique(exclude=exclude)

    def save(self, *args, **kwargs):
        if self._state.adding:
            self.validate_unique()
        super().save(*args, **kwargs)

    # TODO referenced from outside so much that it probably shouldn't be private
    # TODO use below decorator in place of cached_property to prevent redundant reflection from
    # redundant model instances.
    #
    # @key_cached_property(
    #     key_fn=lambda table: (
    #             'sa_table',
    #             table.schema.database.name,
    #             table.oid,
    #         )
    # )
    @cached_property
    def _sa_table(self):
        # We're caching since we want different Django Table instances to return the same SA
        # Table, when they're referencing the same Postgres table.
        try:
            sa_table = reflect_table_from_oid(
                oid=self.oid,
                engine=self._sa_engine,
                metadata=get_cached_metadata(),
            )
        # We catch these errors, since it lets us decouple the cadence of
        # overall DB reflection from the cadence of cache expiration for
        # table names.  Also, it makes it obvious when the DB layer has
        # been altered, as opposed to other reasons for a 404 when
        # requesting a table.
        except (TypeError, IndexError):
            sa_table = table_utils.get_empty_table("MISSING")
        return sa_table

    # NOTE: it's a problem that we hve both _sa_table and _enriched_column_sa_table. at the moment
    # it has to be this way because enriched column is not always interachangeable with sa column.
    @property
    def _enriched_column_sa_table(self):
        return column_utils.get_enriched_column_table(
            table=self._sa_table,
            engine=self._sa_engine,
            metadata=get_cached_metadata(),
        )

    @property
    def primary_key_column_name(self):
        pk_column = get_primary_key_column(self._sa_table)
        return pk_column.name

    @property
    def sa_columns(self):
        return self._enriched_column_sa_table.columns

    @property
    def _sa_engine(self):
        return self.schema._sa_engine

    @property
    def name(self):
        return self._sa_table.name

    @property
    def sa_column_names(self):
        return self.sa_columns.keys()

    @property
    def sa_constraints(self):
        return self._sa_table.constraints

    @property
    def has_dependents(self):
        return has_dependents(
            self.oid,
            self.schema._sa_engine
        )

    @property
    def description(self):
        return get_table_description(self.oid, self._sa_engine)

    def get_dependents(self, exclude=[]):
        return get_dependents_graph(
            self.oid,
            self.schema._sa_engine,
            exclude
        )

    def add_column(self, column_data):
        result = create_column(
            self.schema._sa_engine,
            self.oid,
            column_data,
        )
        reset_reflection()
        return result

    def alter_column(self, column_attnum, column_data):
        result = alter_column(
            self.schema._sa_engine,
            self.oid,
            column_attnum,
            column_data,
        )
        reset_reflection()
        return result

    def drop_column(self, column_attnum):
        drop_column(
            self.oid,
            column_attnum,
            self.schema._sa_engine,
        )
        reset_reflection()

    def duplicate_column(self, column_attnum, copy_data, copy_constraints, name=None):
        result = duplicate_column(
            self.oid,
            column_attnum,
            self.schema._sa_engine,
            new_column_name=name,
            copy_data=copy_data,
            copy_constraints=copy_constraints,
        )
        reset_reflection()
        return result

    def get_preview(self, column_definitions):
        return get_column_cast_records(
            self.schema._sa_engine, self._sa_table, column_definitions
        )

    # TODO unused? delete if so
    @property
    def sa_all_records(self):
        return db_get_records_with_default_order(
            table=self._sa_table,
            engine=self.schema._sa_engine,
        )

    def sa_num_records(self, filter=None, search=[]):
        return get_count(
            table=self._sa_table,
            engine=self.schema._sa_engine,
            filter=filter,
            search=search,
        )

    def update_sa_table(self, update_params):
        result = model_utils.update_sa_table(self, update_params)
        reset_reflection()
        return result

    def delete_sa_table(self):
        result = drop_table(self.name, self.schema.name, self.schema._sa_engine, cascade=True)
        reset_reflection()
        return result

    def get_record(self, id_value):
        return get_record(self._sa_table, self.schema._sa_engine, id_value)

    # TODO consider using **kwargs instead of forwarding params one-by-one
    def get_records(
        self,
        limit=None,
        offset=None,
        filter=None,
        order_by=[],
        group_by=None,
        search=[],
        duplicate_only=None,
    ):
        return db_get_records_with_default_order(
            table=self._sa_table,
            engine=self.schema._sa_engine,
            limit=limit,
            offset=offset,
            filter=filter,
            order_by=order_by,
            group_by=group_by,
            search=search,
            duplicate_only=duplicate_only,
        )

    def create_record_or_records(self, record_data):
        return insert_record_or_records(self._sa_table, self.schema._sa_engine, record_data)

    def update_record(self, id_value, record_data):
        return update_record(self._sa_table, self.schema._sa_engine, id_value, record_data)

    def delete_record(self, id_value):
        return delete_record(self._sa_table, self.schema._sa_engine, id_value)

    def add_constraint(self, constraint_obj):
        create_constraint(
            self._sa_table.schema,
            self.schema._sa_engine,
            constraint_obj
        )
        try:
            # Clearing cache so that new constraint shows up.
            del self._sa_table
        except AttributeError:
            pass
        engine = self.schema.database._sa_engine
        name = constraint_obj.name
        if not name:
            name = constraint_utils.get_constraint_name(
                engine=engine,
                constraint_type=constraint_obj.constraint_type(),
                table_oid=self.oid,
                column_0_attnum=constraint_obj.columns_attnum[0],
                metadata=get_cached_metadata(),
            )
        constraint_oid = get_constraint_oid_by_name_and_table_oid(name, self.oid, engine)
        result = Constraint.current_objects.create(oid=constraint_oid, table=self)
        reset_reflection()
        return result

    def get_column_name_id_bidirectional_map(self):
        columns = Column.objects.filter(table_id=self.id).select_related('table__schema__database').prefetch('name')
        columns_map = bidict({column.name: column.id for column in columns})
        return columns_map

    def get_column_by_name(self, name):
        columns = self.get_columns_by_name(name_list=[name])
        if len(columns) > 0:
            return columns[0]

    def get_columns_by_name(self, name_list):
        columns_by_name_dict = {
            col.name: col
            for col
            in Column.objects.filter(table=self)
            if col.name in name_list
        }
        return [
            columns_by_name_dict[col_name]
            for col_name
            in name_list
        ]

    def move_columns(self, columns_to_move, target_table):
        # Collect various information about relevant columns before mutating
        columns_attnum_to_move = [column.attnum for column in columns_to_move]
        target_table_oid = target_table.oid
        column_names_to_move = [column.name for column in columns_to_move]
        target_columns_name_id_map = target_table.get_column_name_id_bidirectional_map()
        column_names_id_map = self.get_column_name_id_bidirectional_map()

        # Mutate on Postgres
        extracted_sa_table, remainder_sa_table = move_columns_between_related_tables(
            source_table_oid=self.oid,
            target_table_oid=target_table_oid,
            column_attnums_to_move=columns_attnum_to_move,
            schema=self.schema.name,
            engine=self._sa_engine
        )
        engine = self._sa_engine

        # Replicate mutation on Django, so that Django-layer-specific information is preserved
        extracted_table_oid = get_oid_from_table(extracted_sa_table.name, extracted_sa_table.schema, engine)
        remainder_table_oid = get_oid_from_table(remainder_sa_table.name, remainder_sa_table.schema, engine)
        target_table.oid = extracted_table_oid
        target_table.save()
        # Refresh existing target table columns to use correct attnum preventing conflicts with the moved column
        existing_target_column_names = target_columns_name_id_map.keys()
        target_table.update_column_reference(existing_target_column_names, target_columns_name_id_map)
        # Add the moved column
        target_table.update_column_reference(column_names_to_move, column_names_id_map)
        self.oid = remainder_table_oid
        self.save()
        remainder_column_names = column_names_id_map.keys() - column_names_to_move
        self.update_column_reference(remainder_column_names, column_names_id_map)
        reset_reflection()
        return extracted_sa_table, remainder_sa_table

    def split_table(
            self,
            columns_to_extract,
            extracted_table_name,
            column_names_id_map,
    ):
        # Collect various information about relevant columns before mutating
        columns_attnum_to_extract = [column.attnum for column in columns_to_extract]
        extracted_column_names = [column.name for column in columns_to_extract]
        remainder_column_names = column_names_id_map.keys() - extracted_column_names

        # Mutate on Postgres
        extracted_sa_table, remainder_sa_table, remainder_fk = extract_columns_from_table(
            self.oid,
            columns_attnum_to_extract,
            extracted_table_name,
            self.schema.name,
            self._sa_engine
        )
        engine = self._sa_engine

        # Replicate mutation on Django, so that Django-layer-specific information is preserved
        extracted_table_oid = get_oid_from_table(extracted_sa_table.name, extracted_sa_table.schema, engine)
        remainder_table_oid = get_oid_from_table(remainder_sa_table.name, remainder_sa_table.schema, engine)
        extracted_table = Table(oid=extracted_table_oid, schema=self.schema)
        extracted_table.save()

        # Update attnum as it would have changed due to columns moving to a new table.
        extracted_table.update_column_reference(extracted_column_names, column_names_id_map)
        remainder_table = Table.current_objects.get(oid=remainder_table_oid)
        remainder_table.update_column_reference(remainder_column_names, column_names_id_map)
        reset_reflection()
        return extracted_table, remainder_table, remainder_fk

    def update_column_reference(self, column_names, column_name_id_map):
        """
        Will update the columns specified via column_names to have the right attnum and to be part
        of this table.
        """
        column_names_attnum_map = get_column_attnum_from_names_as_map(
            self.oid,
            column_names,
            self._sa_engine,
            metadata=get_cached_metadata(),
        )
        column_objs = []
        for column_name, column_attnum in column_names_attnum_map.items():
            column_id = column_name_id_map[column_name]
            column = Column.current_objects.get(id=column_id)
            column.table_id = self.id
            column.attnum = column_attnum
            column_objs.append(column)
        Column.current_objects.bulk_update(column_objs, fields=['table_id', 'attnum'])

    def insert_records_to_existing_table(self, existing_table, data_files, mappings=None):
        from_table = self._sa_table
        target_table = existing_table._sa_table
        engine = self._sa_engine
        if mappings:
            col_mappings = [[from_col.name, target_col.name] for from_col, target_col in mappings]
        else:
            col_mappings = None
        data_file = data_files[0]
        try:
            table, _ = insert_from_select(from_table, target_table, engine, col_mappings)
            data_file.table_imported_to = existing_table
        except Exception as e:
            # ToDo raise specific exceptions.
            raise e
        return table


class Column(ReflectionManagerMixin, BaseModel):
    table = models.ForeignKey('Table', on_delete=models.CASCADE, related_name='columns')
    attnum = models.IntegerField()
    display_options = JSONField(null=True, default=None)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["attnum", "table"], name="unique_column")
        ]

    def __str__(self):
        return f"{self.__class__.__name__}: {self.table_id}-{self.attnum}"

    def __getattribute__(self, name):
        try:
            return super().__getattribute__(name)
        except AttributeError as e:
            # Blacklist Django attribute names that cause recursion by trying to fetch an invalid cache.
            # TODO Find a better way to avoid finding Django related columns
            blacklisted_attribute_names = ['resolve_expression', '_prefetched_objects_cache']
            if name not in blacklisted_attribute_names:
                return getattr(self._sa_column, name)
            else:
                raise e
    current_objects = models.Manager()
    objects = DatabaseObjectManager(
        name=ColumnNamePrefetcher
    )

    @property
    def _sa_engine(self):
        return self.table._sa_engine

    # TODO probably shouldn't be private: a lot of code already references it.
    @property
    def _sa_column(self):
        return self.table.sa_columns[self.name]

    # TODO use below decorator in place of cached_property to prevent redundant reflection from
    # redundant model instances.
    #
    # @key_cached_property(
    #     key_fn=lambda column: (
    #             "column name",
    #             column.table.schema.database.name,
    #             column.table.schema.name,
    #             column.table.oid,
    #             column.attnum,
    #         )
    # )
    @cached_property
    def name(self):
        name = get_column_name_from_attnum(
            self.table.oid,
            self.attnum,
            self._sa_engine,
            metadata=get_cached_metadata(),
        )
        assert type(name) is str
        if name is None:
            raise ProgrammingAPIException(
                Exception(
                    "attempted to access column's name after it was dropped"
                )
            )
        else:
            return name

    @property
    def ui_type(self):
        if self.db_type:
            return get_ui_type_from_db_type(self.db_type)

    @property
    def db_type(self):
        return self._sa_column.db_type

    @property
    def has_dependents(self):
        return has_dependents(
            self.table.oid,
            self._sa_engine,
            self.attnum
        )

    def get_dependents(self, exclude):
        return get_dependents_graph(
            self.table.oid,
            self._sa_engine,
            exclude,
            self.attnum
        )


class Constraint(DatabaseObject):
    table = models.ForeignKey('Table', on_delete=models.CASCADE, related_name='constraints')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["oid", "table"], name="unique_constraint")
        ]

    # TODO try to cache this for an entire request
    @property
    def _constraint_record(self):
        engine = self.table.schema.database._sa_engine
        return get_constraint_record_from_oid(self.oid, engine, get_cached_metadata())

    @property
    def name(self):
        return self._constraint_record['conname']

    @property
    def type(self):
        return constraint_utils.get_constraint_type_from_char(self._constraint_record['contype'])

    @cached_property
    def columns(self):
        column_attnum_list = self._constraint_record['conkey']
        return Column.objects.filter(table=self.table, attnum__in=column_attnum_list).order_by("attnum")

    @cached_property
    def referent_columns(self):
        column_attnum_list = self._constraint_record['confkey']
        if column_attnum_list:
            foreign_relation_oid = self._constraint_record['confrelid']
            columns = Column.objects.filter(table__oid=foreign_relation_oid, table__schema=self.table.schema, attnum__in=column_attnum_list).order_by("attnum")
            return columns

    @property
    def ondelete(self):
        action_char = self._constraint_record['confdeltype']
        return constraint_utils.get_constraint_action_from_char(action_char)

    @property
    def onupdate(self):
        action_char = self._constraint_record['confupdtype']
        return constraint_utils.get_constraint_action_from_char(action_char)

    @property
    def deferrable(self):
        return self._constraint_record['condeferrable']

    @property
    def match(self):
        type_char = self._constraint_record['confmatchtype']
        return constraint_utils.get_constraint_match_type_from_char(type_char)

    def drop(self):
        drop_constraint(
            self.table._sa_table.name,
            self.table._sa_table.schema,
            self.table.schema._sa_engine,
            self.name
        )
        self.delete()
        reset_reflection()


class DataFile(BaseModel):
    created_from_choices = models.TextChoices("created_from", "FILE PASTE URL")

    file = models.FileField(upload_to=model_utils.user_directory_path)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, blank=True, null=True, on_delete=models.CASCADE)
    created_from = models.CharField(max_length=128, choices=created_from_choices.choices)
    table_imported_to = models.ForeignKey(Table, related_name="data_files", blank=True,
                                          null=True, on_delete=models.SET_NULL)

    base_name = models.CharField(max_length=100)
    header = models.BooleanField(default=True)
    delimiter = models.CharField(max_length=1, default=',', blank=True)
    escapechar = models.CharField(max_length=1, blank=True)
    quotechar = models.CharField(max_length=1, default='"', blank=True)


class PreviewColumnSettings(BaseModel):
    customized = models.BooleanField()
    template = models.CharField(max_length=255)


class TableSettings(ReflectionManagerMixin, BaseModel):
    preview_settings = models.OneToOneField(PreviewColumnSettings, on_delete=models.CASCADE)
    table = models.OneToOneField(Table, on_delete=models.CASCADE, related_name="settings")


def _create_table_settings(tables):
    # TODO Bulk create preview settings to improve performance
    for table in tables:
        preview_column_settings = PreviewColumnSettings.objects.create(customized=False)
        TableSettings.current_objects.create(table=table, preview_settings=preview_column_settings)


def _compute_preview_template(table):
    if not table.settings.preview_settings.customized:
        columns = Column.current_objects.filter(table=table).prefetch_related('table', 'table__schema', 'table__schema__database').order_by('attnum')
        preview_column = None
        primary_key_column = None
        for column in columns:
            if column.primary_key:
                primary_key_column = column
            else:
                preview_column = column
                break
        if preview_column is None:
            preview_column = primary_key_column
        preview_template = f"{{{preview_column.id}}}"
        preview_settings = table.settings.preview_settings
        preview_settings.template = preview_template
        preview_settings.save()
