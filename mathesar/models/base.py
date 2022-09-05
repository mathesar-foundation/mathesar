from bidict import bidict

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import JSONField, Deferrable
from django.utils.functional import cached_property
from django.contrib.auth.models import User

from db.columns import utils as column_utils
from db.columns.operations.create import create_column, duplicate_column
from db.columns.operations.alter import alter_column
from db.columns.operations.drop import drop_column
from db.columns.operations.select import get_column_name_from_attnum, get_columns_attnum_from_names
from db.constraints.operations.create import create_constraint
from db.constraints.operations.drop import drop_constraint
from db.constraints.operations.select import get_constraint_oid_by_name_and_table_oid, get_constraint_from_oid
from db.constraints import utils as constraint_utils
from db.dependents.dependents_utils import get_dependents_graph, has_dependencies
from db.records.operations.delete import delete_record
from db.records.operations.insert import insert_record_or_records
from db.records.operations.select import get_column_cast_records, get_count, get_record
from db.records.operations.select import get_records_with_default_order as db_get_records_with_default_order
from db.records.operations.update import update_record
from db.schemas.operations.drop import drop_schema
from db.schemas import utils as schema_utils
from db.tables import utils as table_utils
from db.tables.operations.drop import drop_table
from db.tables.operations.move_columns import move_columns_between_related_tables
from db.tables.operations.select import get_oid_from_table, reflect_table_from_oid
from db.tables.operations.split import extract_columns_from_table
from db.records.operations.insert import insert_from_select

from mathesar import reflection
from mathesar.models.relation import Relation
from mathesar.utils import models as model_utils
from mathesar.database.base import create_mathesar_engine
from mathesar.database.types import UIType, get_ui_type_from_db_type


NAME_CACHE_INTERVAL = 60 * 5


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DatabaseObjectManager(models.Manager):
    def get_queryset(self):
        reflection.reflect_db_objects()
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

    @cached_property
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
    def has_dependencies(self):
        return has_dependencies(
            self.oid,
            self._sa_engine
        )

    @property
    def dependents(self):
        return get_dependents_graph(
            self.oid,
            self._sa_engine
        )

    def update_sa_schema(self, update_params):
        return model_utils.update_sa_schema(self, update_params)

    def delete_sa_schema(self):
        return drop_schema(self.name, self._sa_engine, cascade=True)

    def clear_name_cache(self):
        cache_key = f"{self.database.name}_schema_name_{self.oid}"
        cache.delete(cache_key)


class Table(DatabaseObject, Relation):
    # These are fields whose source of truth is in the model
    MODEL_FIELDS = ['import_verified']

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
    @cached_property
    def _sa_table(self):
        # We're caching since we want different Django Table instances to return the same SA
        # Table, when they're referencing the same Postgres table.
        try:
            sa_table = reflect_table_from_oid(
                oid=self.oid,
                engine=self._sa_engine,
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
    @cached_property
    def _enriched_column_sa_table(self):
        return column_utils.get_enriched_column_table(
            table=self._sa_table,
            engine=self._sa_engine,
        )

    @cached_property
    def sa_columns(self):
        return self._enriched_column_sa_table.columns

    @cached_property
    def _sa_engine(self):
        return self.schema._sa_engine

    @cached_property
    def name(self):
        return self._sa_table.name

    @property
    def sa_column_names(self):
        return self.sa_columns.keys()

    @property
    def sa_constraints(self):
        return self._sa_table.constraints

    @property
    def has_dependencies(self):
        return has_dependencies(
            self.oid,
            self.schema._sa_engine
        )

    @property
    def dependents(self):
        return get_dependents_graph(
            self.oid,
            self.schema._sa_engine
        )

    def add_column(self, column_data):
        return create_column(
            self.schema._sa_engine,
            self.oid,
            column_data,
        )

    def alter_column(self, column_attnum, column_data):
        return alter_column(
            self.schema._sa_engine,
            self.oid,
            column_attnum,
            column_data,
        )

    def drop_column(self, column_attnum):
        drop_column(
            self.oid,
            column_attnum,
            self.schema._sa_engine,
        )

    def duplicate_column(self, column_attnum, copy_data, copy_constraints, name=None):
        return duplicate_column(
            self.oid,
            column_attnum,
            self.schema._sa_engine,
            new_column_name=name,
            copy_data=copy_data,
            copy_constraints=copy_constraints,
        )

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
        return model_utils.update_sa_table(self, update_params)

    def delete_sa_table(self):
        return drop_table(self.name, self.schema.name, self.schema._sa_engine, cascade=True)

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
            name = constraint_utils.get_constraint_name(engine, constraint_obj.constraint_type(), self.oid, constraint_obj.columns_attnum[0])
        constraint_oid = get_constraint_oid_by_name_and_table_oid(name, self.oid, engine)
        return Constraint.current_objects.create(oid=constraint_oid, table=self)

    def get_column_name_id_bidirectional_map(self):
        # TODO: Prefetch column names to avoid N+1 queries
        columns = Column.objects.filter(table_id=self.id)
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
        columns_attnum_to_move = [column.attnum for column in columns_to_move]
        target_table_oid = target_table.oid
        return move_columns_between_related_tables(
            self.oid,
            target_table_oid,
            columns_attnum_to_move,
            self.schema.name,
            self._sa_engine
        )

    def split_table(
            self,
            columns_to_extract,
            extracted_table_name,
    ):
        columns_attnum_to_extract = [column.attnum for column in columns_to_extract]
        return extract_columns_from_table(
            self.oid,
            columns_attnum_to_extract,
            extracted_table_name,
            self.schema.name,
            self._sa_engine
        )

    def update_column_reference(self, columns_name, column_name_id_map):
        columns_name_attnum_map = get_columns_attnum_from_names(
            self.oid,
            columns_name,
            self._sa_engine,
            return_as_name_map=True
        )
        column_objs = []
        for column_name, column_attnum in columns_name_attnum_map.items():
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
            models.UniqueConstraint(fields=["attnum", "table"], name="unique_column", deferrable=Deferrable.DEFERRED)
        ]

    def __str__(self):
        return f"{self.__class__.__name__}: {self.table_id}-{self.attnum}"

    def __getattribute__(self, name):
        try:
            return super().__getattribute__(name)
        except AttributeError as e:
            # Blacklist Django attribute names that cause recursion by trying to fetch an invalid cache.
            # TODO Find a better way to avoid finding Django related columns
            blacklisted_attribute_names = ['resolve_expression']
            if name not in blacklisted_attribute_names:
                return getattr(self._sa_column, name)
            else:
                raise e

    @property
    def _sa_engine(self):
        return self.table._sa_engine

    # TODO probably shouldn't be private: a lot of code already references it.
    @property
    def _sa_column(self):
        return self.table.sa_columns[self.name]

    @property
    def name(self):
        return get_column_name_from_attnum(
            self.table.oid, self.attnum, self._sa_engine,
        )

    @property
    def ui_type(self):
        if self.db_type:
            return get_ui_type_from_db_type(self.db_type)

    @property
    def db_type(self):
        return self._sa_column.db_type


class Constraint(DatabaseObject):
    table = models.ForeignKey('Table', on_delete=models.CASCADE, related_name='constraints')

    @cached_property
    def _sa_constraint(self):
        engine = self.table.schema.database._sa_engine
        return get_constraint_from_oid(self.oid, engine, self.table._sa_table)

    @property
    def name(self):
        return self._sa_constraint.name

    @property
    def type(self):
        return constraint_utils.get_constraint_type_from_class(self._sa_constraint)

    @cached_property
    def columns(self):
        column_names = [column.name for column in self._sa_constraint.columns]
        engine = self.table.schema.database._sa_engine
        column_attnum_list = [result for result in get_columns_attnum_from_names(self.table.oid, column_names, engine)]
        return Column.objects.filter(table=self.table, attnum__in=column_attnum_list).order_by("attnum")

    @cached_property
    def referent_columns(self):
        if self.type == constraint_utils.ConstraintType.FOREIGN_KEY.value:
            column_names = [fk.column.name for fk in self._sa_constraint.elements]
            engine = self.table.schema._sa_engine
            oid = get_oid_from_table(self._sa_constraint.referred_table.name,
                                     self._sa_constraint.referred_table.schema,
                                     engine)
            table = Table.objects.get(oid=oid, schema=self.table.schema)
            column_attnum_list = get_columns_attnum_from_names(oid, column_names, table.schema._sa_engine)
            columns = Column.objects.filter(table=table, attnum__in=column_attnum_list).order_by("attnum")
            return columns
        return None

    @cached_property
    def ondelete(self):
        if self.type == constraint_utils.ConstraintType.FOREIGN_KEY.value:
            return self._sa_constraint.ondelete

    @cached_property
    def onupdate(self):
        if self.type == constraint_utils.ConstraintType.FOREIGN_KEY.value:
            return self._sa_constraint.onupdate

    @cached_property
    def deferrable(self):
        if self.type == constraint_utils.ConstraintType.FOREIGN_KEY.value:
            return self._sa_constraint.deferrable

    @cached_property
    def match(self):
        if self.type == constraint_utils.ConstraintType.FOREIGN_KEY.value:
            return self._sa_constraint.match

    def drop(self):
        drop_constraint(
            self.table._sa_table.name,
            self.table._sa_table.schema,
            self.table.schema._sa_engine,
            self.name
        )
        self.delete()


class DataFile(BaseModel):
    created_from_choices = models.TextChoices("created_from", "FILE PASTE URL")

    file = models.FileField(upload_to=model_utils.user_directory_path)
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)
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
