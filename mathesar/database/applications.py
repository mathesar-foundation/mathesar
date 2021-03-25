from sqlalchemy import text
from sqlalchemy.schema import CreateSchema

from mathesar.database.base import APP_PREFIX, DBObject, engine, inspector


class Application(DBObject):
    def __init__(self, name):
        self.name = name

    @property
    def schema(self):
        return self.db_name

    def _schema_exists(self):
        return self.schema in self.get_all_schemas()

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

    @classmethod
    def get_all_schemas(cls):
        return [
            schema
            for schema in inspector.get_schema_names()
            if schema.startswith(APP_PREFIX)
        ]
