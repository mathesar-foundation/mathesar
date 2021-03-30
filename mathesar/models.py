from django.db import models
from sqlalchemy.orm import Session

from mathesar.database.base import db_name, engine, metadata
from mathesar.database.collections import DBCollection


class DatabaseObject(models.Model):
    name = models.CharField(max_length=63)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    @property
    def db_name(self):
        return db_name(self.name)

    def __str__(self):
        return f"{self.__class__.__name__}: {self.name}"


class Collection(DatabaseObject):
    schema = models.CharField(max_length=63)

    @property
    def db_collection(self):
        return DBCollection(
            self.db_name,
            metadata,
            schema=self.schema,
            autoload_with=engine,
            extend_existing=True,
        )

    @property
    def query(self):
        with Session(engine) as session:
            query = session.query(self.db_collection)
            return query

    @property
    def columns(self):
        return self.query.column_descriptions

    @property
    def records(self):
        return self.query.all()
