from django.db import models
from sqlalchemy import Table
from sqlalchemy.orm import Session

from mathesar.database.base import engine, metadata


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
    def sa_table(self):
        return Table(
            self.name,
            metadata,
            schema=self.schema,
            autoload_with=engine,
            extend_existing=True,
        )

    @property
    def sa_query(self):
        with Session(engine) as session:
            query = session.query(self.sa_table)
            return query

    @property
    def sa_columns(self):
        return self.sa_query.column_descriptions

    @property
    def sa_records(self):
        return self.sa_query.all()
