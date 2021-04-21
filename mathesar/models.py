from django.db import models

from mathesar.database.base import create_mathesar_engine
from db import tables

engine = create_mathesar_engine()


class DatabaseObject(models.Model):
    name = models.CharField(max_length=63)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.__class__.__name__}: {self.name}"


class Collection(DatabaseObject):
    schema = models.CharField(max_length=63)

    @property
    def sa_columns(self):
        return tables.reflect_table_columns(self.name, self.schema, engine)

    @property
    def sa_records(self):
        return tables.get_all_table_records(self.name, self.schema, engine)
