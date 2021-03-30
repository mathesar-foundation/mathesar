from sqlalchemy.schema import CreateSchema

from mathesar.database.base import APP_PREFIX, db_name, engine, inspector


class DBApplication(object):
    def __init__(self, name):
        self.name = name

    @property
    def schema(self):
        return db_name(self.name)

    def _schema_exists(self):
        return self.schema in self.get_all_schemas()

    def create(self):
        """
        This method creates a Postgres schema corresponding to the application.
        """
        if not self._schema_exists():
            with engine.begin() as connection:
                connection.execute(CreateSchema(f"{self.schema}"))

    @classmethod
    def get_all_schemas(cls):
        return [
            schema
            for schema in inspector.get_schema_names()
            if schema.startswith(APP_PREFIX)
        ]
