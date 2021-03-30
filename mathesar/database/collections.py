from sqlalchemy import Column, Integer, String, Table

from mathesar.database.applications import DBApplication
from mathesar.database.base import ID, db_name, engine, metadata


class DBCollection(Table):
    DEFAULT_COLUMNS = [
        Column(ID, Integer, primary_key=True),
    ]

    def insert_rows(self, rows):
        with engine.begin() as connection:
            result = connection.execute(self.insert(), rows)
            return result

    @classmethod
    def create_from_columns(cls, name, column_names):
        """
        This method creates a Postgres table corresponding to the collection.
        """
        db_application = DBApplication(name)
        db_application.create()
        columns = cls.DEFAULT_COLUMNS + [
            Column(column_name, String) for column_name in column_names
        ]
        db_collection = cls(
            db_name(name),
            metadata,
            *columns,
            schema=db_application.schema,
        )
        metadata.create_all(engine, tables=[db_collection])
        return db_collection

    @classmethod
    def create_from_csv(cls, name, csv_reader):
        db_collection = cls.create_from_columns(name, csv_reader.fieldnames)
        db_collection.insert_rows([row for row in csv_reader])
        return db_collection
