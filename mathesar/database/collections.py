from sqlalchemy import TIMESTAMP, Column, Integer, String, Table, func
from sqlalchemy.exc import NoSuchTableError

from mathesar.database.applications import Application
from mathesar.database.base import CREATED, ID, MODIFIED, DBObject, engine, metadata
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
        try:
            self.table = Table(
                self.db_name,
                metadata,
                schema=self.application.schema,
                autoload_with=engine,
                extend_existing=True,
            )
        except NoSuchTableError:
            self.table = None

    def create(self, column_names):
        """
        This method creates a Postgres table corresponding to the collection.
        """
        columns = self.DEFAULT_COLUMNS + [
            Column(column_name, String) for column_name in column_names
        ]
        if self.table is None:
            self.table = Table(
                self.db_name,
                metadata,
                *columns,
                schema=self.application.schema,
                comment=self.get_comment(),
            )
        metadata.create_all(engine, tables=[self.table])

    def insert_rows(self, rows):
        with engine.begin() as connection:
            result = connection.execute(self.table.insert(), rows)
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
