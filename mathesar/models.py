from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import models
from django.utils.functional import cached_property

from mathesar.database.base import create_mathesar_engine
from mathesar.utils import models as model_utils
from db import tables, records, schemas, columns

NAME_CACHE_INTERVAL = 60 * 5


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DatabaseObject(BaseModel):
    oid = models.IntegerField()

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}: {self.oid}"


# TODO: Replace with a proper form of caching
# See: https://github.com/centerofci/mathesar/issues/280
_engines = {}


class Schema(DatabaseObject):
    database = models.CharField(max_length=128)

    @property
    def _sa_engine(self):
        global _engines
        # We're caching this since the engine is used frequently.
        if self.database not in _engines:
            _engines[self.database] = create_mathesar_engine(self.database)
        return _engines[self.database]

    @cached_property
    def name(self):
        cache_key = f"{self.database}_schema_name_{self.oid}"
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
    def name(self):
        return self._sa_table.name

    @property
    def sa_columns(self):
        return self._sa_table.columns

    @property
    def sa_column_names(self):
        return self.sa_columns.keys()

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

    @property
    def sa_all_records(self):
        return records.get_records(self._sa_table, self.schema._sa_engine)

    def sa_num_records(self, filters=[]):
        return tables.get_count(self._sa_table, self.schema._sa_engine, filters=filters)

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


class DataFile(BaseModel):
    file = models.FileField(
        upload_to=model_utils.user_directory_path,
    )
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)
    table_imported_to = models.ForeignKey(Table, related_name="data_files", blank=True,
                                          null=True, on_delete=models.SET_NULL)
    delimiter = models.CharField(max_length=1, default=',', blank=True)
    escapechar = models.CharField(max_length=1, blank=True)
    quotechar = models.CharField(max_length=1, default='"', blank=True)
