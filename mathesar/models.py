from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils.functional import cached_property

from mathesar.database.base import create_mathesar_engine
from mathesar.utils import models as model_utils
from db import tables, records


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class DatabaseObject(BaseModel):
    name = models.CharField(max_length=63)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}: {self.name}"


class Schema(DatabaseObject):
    database = models.CharField(max_length=128)


class Table(DatabaseObject):
    schema = models.ForeignKey('Schema', on_delete=models.CASCADE,
                               related_name='tables')
    import_verified = models.BooleanField(blank=True, null=True)

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

    def create_record_or_records(self, record_data):
        return records.create_record_or_records(self._sa_table, self._sa_engine, record_data)

    def update_record(self, id_value, record_data):
        return records.update_record(self._sa_table, self._sa_engine, id_value, record_data)

    def delete_record(self, id_value):
        return records.delete_record(self._sa_table, self._sa_engine, id_value)


class DataFile(BaseModel):
    file = models.FileField(
        upload_to=model_utils.user_directory_path,
    )
    user = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)
    table_imported_to = models.ForeignKey(Table, related_name="data_files", blank=True,
                                          null=True, on_delete=models.SET_NULL)
