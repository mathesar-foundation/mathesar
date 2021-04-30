from django.db import models
from django.utils.functional import cached_property

from mathesar.database.base import create_mathesar_engine
from db import tables, records


class DatabaseObject(models.Model):
    name = models.CharField(max_length=63)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}: {self.name}"


class Schema(DatabaseObject):
    database = models.CharField(max_length=128)


class Table(DatabaseObject):
    schema = models.ForeignKey('Schema', on_delete=models.CASCADE, related_name='tables')

    @cached_property
    def _sa_engine(self):
        # We're caching this since the engine is used frequently.
        return create_mathesar_engine(self.schema.database)

    @property
    def _sa_table(self):
        return tables.reflect_table(self.name, self.schema.name, self._sa_engine)

    @property
    def sa_columns(self):
        return self._sa_table.columns

    @property
    def sa_column_names(self):
        return self.sa_columns.keys()

    @property
    def sa_num_records(self):
        return tables.get_count(self._sa_table, self._sa_engine)

    @property
    def sa_all_records(self):
        return records.get_records(self._sa_table, self._sa_engine)

    def get_record(self, id_value):
        return records.get_record(self._sa_table, self._sa_engine, id_value)

    def get_records(self, limit=None, offset=None):
        return records.get_records(self._sa_table, self._sa_engine, limit, offset)

    def create_records(self, record_data):
        return records.create_records(self._sa_table, self._sa_engine, record_data)

    def delete_record(self, id_value):
        return records.delete_record(self._sa_table, self._sa_engine, id_value)
