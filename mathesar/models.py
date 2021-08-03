from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import models
from django.utils.functional import cached_property

from mathesar import reflection
from mathesar.utils import models as model_utils
from mathesar.database.base import create_mathesar_engine
from db import tables, records, schemas, columns, constraints
from db.types.alteration import get_supported_alter_column_types

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


class DatabaseObject(BaseModel):
    oid = models.IntegerField()
    # The default manager, current_objects, does not reflect databse objects.
    # This saves us from having to deal with Django trying to automatically reflect db
    # objects in the background when we might not expect it.
    current_objects = models.Manager()
    objects = DatabaseObjectManager()

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}: {self.oid}"


# TODO: Replace with a proper form of caching
# See: https://github.com/centerofci/mathesar/issues/280
_engines = {}


class Database(BaseModel):
    current_objects = models.Manager()
    objects = DatabaseObjectManager()
    name = models.CharField(max_length=128, unique=True)
    deleted = models.BooleanField(blank=True, default=False)

    @property
    def _sa_engine(self):
        global _engines
        # We're caching this since the engine is used frequently.
        if self.name not in _engines:
            _engines[self.name] = create_mathesar_engine(self.name)
        return _engines[self.name]

    @property
    def supported_types(self):
        types = get_supported_alter_column_types(self._sa_engine)
        return [t for t, _ in types.items()]


class Schema(DatabaseObject):
    database = models.ForeignKey('Database', on_delete=models.CASCADE,
                                 related_name='schemas')

    @property
    def _sa_engine(self):
        return self.database._sa_engine

    @cached_property
    def name(self):
        cache_key = f"{self.database.name}_schema_name_{self.oid}"
        try:
            schema_name = cache.get(cache_key)
            if schema_name is None:
                schema_name = schemas.get_schema_name_from_oid(
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

    # TODO: This should check for dependencies once the depdency endpoint is implemeted
    @property
    def has_dependencies(self):
        return True

    def update_sa_schema(self, update_params):
        return model_utils.update_sa_schema(self, update_params)

    def delete_sa_schema(self):
        return schemas.delete_schema(self.name, self._sa_engine, cascade=True)

    def clear_name_cache(self):
        cache_key = f"{self.database.name}_schema_name_{self.oid}"
        cache.delete(cache_key)


class Table(DatabaseObject):
    schema = models.ForeignKey('Schema', on_delete=models.CASCADE,
                               related_name='tables')
    import_verified = models.BooleanField(blank=True, null=True)

    @cached_property
    def _sa_table(self):
        try:
            table = tables.reflect_table_from_oid(
                self.oid, self.schema._sa_engine,
            )
        # We catch these errors, since it lets us decouple the cadence of
        # overall DB reflection from the cadence of cache expiration for
        # table names.  Also, it makes it obvious when the DB layer has
        # been altered, as opposed to other reasons for a 404 when
        # requesting a table.
        except (TypeError, IndexError):
            table = tables.create_empty_table("MISSING")
        return table

    @cached_property
    def _enriched_column_sa_table(self):
        return tables.get_enriched_column_table(
            self._sa_table, engine=self.schema._sa_engine,
        )

    @cached_property
    def name(self):
        return self._sa_table.name

    @cached_property
    def sa_columns(self):
        return self._enriched_column_sa_table.columns

    @property
    def sa_constraints(self):
        return self._sa_table.constraints

    @property
    def sa_column_names(self):
        return self.sa_columns.keys()

    # TODO: This should check for dependencies once the depdency endpoint is implemeted
    @property
    def has_dependencies(self):
        return True

    def add_column(self, column_data):
        return columns.create_column(
            self.schema._sa_engine,
            self.oid,
            column_data,
        )

    def alter_column(self, column_index, column_data):
        return columns.alter_column(
            self.schema._sa_engine,
            self.oid,
            column_index,
            column_data,
        )

    def drop_column(self, column_index):
        columns.drop_column(
            self.schema._sa_engine,
            self.oid,
            column_index,
        )

    def get_preview(self, column_definitions):
        return tables.get_column_cast_records(
            self.schema._sa_engine, self._sa_table, column_definitions
        )

    @property
    def sa_all_records(self):
        return records.get_records(self._sa_table, self.schema._sa_engine)

    def sa_num_records(self, filters=[]):
        return tables.get_count(self._sa_table, self.schema._sa_engine, filters=filters)

    def update_sa_table(self, update_params):
        return model_utils.update_sa_table(self, update_params)

    def delete_sa_table(self):
        return tables.delete_table(self.name, self.schema.name, self.schema._sa_engine,
                                   cascade=True)

    def get_record(self, id_value):
        return records.get_record(self._sa_table, self.schema._sa_engine, id_value)

    def get_records(self, limit=None, offset=None, filters=[], order_by=[]):
        return records.get_records(self._sa_table, self.schema._sa_engine, limit,
                                   offset, filters=filters, order_by=order_by)

    def get_group_counts(
        self, group_by, limit=None, offset=None, filters=[], order_by=[]
    ):
        return records.get_group_counts(self._sa_table, self.schema._sa_engine,
                                        group_by, limit, offset, filters=filters,
                                        order_by=order_by)

    def create_record_or_records(self, record_data):
        return records.create_record_or_records(self._sa_table, self.schema._sa_engine, record_data)

    def update_record(self, id_value, record_data):
        return records.update_record(self._sa_table, self.schema._sa_engine, id_value, record_data)

    def delete_record(self, id_value):
        return records.delete_record(self._sa_table, self.schema._sa_engine, id_value)

    def get_constraint_by_type_and_columns(self, constraint_type, columns):
        for constraint in self.sa_constraints:
            current_constraint_type = constraints.get_constraint_type_from_class(constraint)
            if current_constraint_type == constraint_type and set(columns) == set([column.name for column in constraint.columns]):
                return constraint
        return None

    def add_constraint(self, constraint_data):
        if 'type' not in constraint_data or constraint_data['type'] != constraints.ConstraintType.UNIQUE.value:
            raise ValueError('Only creating unique constraints is currently supported.')
        constraints.create_unique_constraint(
            self._sa_table.name,
            self._sa_table.schema,
            self.schema._sa_engine,
            constraint_data['columns'],
            constraint_data['name'] if 'name' in constraint_data else None
        )
        try:
            # Clearing cache so that new constraint shows up.
            del self._sa_table
        except AttributeError:
            pass
        sa_constraint = self.get_constraint_by_type_and_columns(
            constraint_data['type'],
            constraint_data['columns']
        )
        engine = self.schema.database._sa_engine
        constraint_oid = constraints.get_constraint_oid_by_name_and_table_oid(sa_constraint.name, self.oid, engine)
        return Constraint.objects.create(oid=constraint_oid, table=self)


class Constraint(DatabaseObject):
    table = models.ForeignKey('Table', on_delete=models.CASCADE, related_name='constraints')

    @property
    def _sa_constraint(self):
        engine = self.table.schema.database._sa_engine
        return constraints.get_constraint_from_oid(self.oid, engine)

    @property
    def name(self):
        return self._sa_constraint.name

    @property
    def type(self):
        return constraints.get_constraint_type_from_class(self._sa_constraint)

    @cached_property
    def columns(self):
        return [column.name for column in self._sa_constraint.columns]

    def drop(self):
        constraints.drop_constraint(
            self.table._sa_table.name,
            self.table._sa_table.schema,
            self.table.schema._sa_engine,
            self.name
        )
        self.delete()


class DataFile(BaseModel):
    created_from_choices = models.TextChoices("created_from", "FILE PASTE")

    file = models.FileField(
        upload_to=model_utils.user_directory_path,
    )
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)
    created_from = models.CharField(max_length=128, choices=created_from_choices.choices)
    table_imported_to = models.ForeignKey(Table, related_name="data_files", blank=True,
                                          null=True, on_delete=models.SET_NULL)
    header = models.BooleanField(default=True)
    delimiter = models.CharField(max_length=1, default=',', blank=True)
    escapechar = models.CharField(max_length=1, blank=True)
    quotechar = models.CharField(max_length=1, default='"', blank=True)
