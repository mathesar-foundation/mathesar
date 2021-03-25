from sqlalchemy import TIMESTAMP, Column, Integer, String, Table, func
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.orm import Session

from mathesar.database.applications import Application
from mathesar.database.base import (
    CREATED,
    ID,
    MODIFIED,
    DBObject,
    engine,
    inspector,
    metadata,
)
from mathesar.imports.csv import get_csv_reader


class Collection(DBObject):
    DEFAULT_COLUMNS = [
        Column(CREATED, TIMESTAMP, server_default=func.now()),
        Column(MODIFIED, TIMESTAMP, server_default=func.now()),
        Column(ID, Integer, primary_key=True),
    ]

    def __init__(self, name, application):
        self.name = name
        self.application = application

    @property
    def data(self):
        with Session(engine) as session:
            table = self.get_table()
            if table is not None:
                query = session.query(table)
                return {
                    "name": self.name,
                    "uuid": self.find_uuid(table),
                    "records": query.all(),
                    "columns": query.column_descriptions,
                }
        return {}

    def get_table(self):
        try:
            return Table(
                self.db_name,
                metadata,
                schema=self.application.schema,
                autoload_with=engine,
                extend_existing=True,
            )
        except NoSuchTableError:
            return None

    def find_uuid(self, table=None):
        if table is None:
            table = self.get_table()
        return self.get_uuid(table.comment)

    def create(self, column_names):
        """
        This method creates a Postgres table corresponding to the collection.
        """
        columns = self.DEFAULT_COLUMNS + [
            Column(column_name, String) for column_name in column_names
        ]
        comment = self.get_comment()
        if self.get_table() is None:
            table = Table(
                self.db_name,
                metadata,
                *columns,
                schema=self.application.schema,
                comment=comment,
            )
        metadata.create_all(engine, tables=[table])
        return self

    def insert_rows(self, rows):
        with engine.begin() as connection:
            result = connection.execute(self.get_table().insert(), rows)
            return result

    @classmethod
    def create_from_csv(cls, csv_file):
        # TODO: Accept name as input from frontend.
        name = csv_file.name.lower()[:-4].title()

        csv_reader = get_csv_reader(csv_file)
        application = Application(name)
        application.create()
        collection = cls(name, application)
        collection.create(csv_reader.fieldnames)
        collection.insert_rows([row for row in csv_reader])
        return collection

    @classmethod
    def all(cls):
        collections = []
        schemas = Application.get_all_schemas()
        for schema in schemas:
            tables = inspector.get_table_names(schema)
            for table in tables:
                collections.append(
                    cls(
                        cls.get_human_readable_name(table),
                        Application(cls.get_human_readable_name(schema)),
                    )
                )
        return collections

    @classmethod
    def get_from_uuid(cls, uuid):
        collections = cls.all()
        for collection in collections:
            if collection.find_uuid() == uuid:
                return collection
        return None
