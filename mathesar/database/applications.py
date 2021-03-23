from sqlalchemy import Table, select, text
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateSchema

from mathesar.database.base import DBObject, engine, metadata


class Application(DBObject):
    def __init__(self, name):
        self.name = name

    @property
    def schema(self):
        return self.db_name

    def _schema_exists(self):
        schemata_table = Table(
            "schemata",
            metadata,
            schema="information_schema",
            autoload_with=engine,
        )
        with Session(engine) as session:
            schemas = [
                row[0]
                for row in session.execute(
                    select([schemata_table.columns["schema_name"]])
                )
            ]
            return self.schema in schemas

    def create(self):
        """
        This method creates a Postgres schema corresponding to the application.
        """
        schema_comment = self.get_comment()
        if not self._schema_exists():
            with engine.begin() as connection:
                connection.execute(CreateSchema(f"{self.schema}"))
                connection.execute(
                    text(f"COMMENT ON SCHEMA \"{self.schema}\" IS '{schema_comment}';")
                )
