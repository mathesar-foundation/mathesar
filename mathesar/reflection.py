from django.conf import settings
from django.core.cache import cache

from mathesar.database.base import create_mathesar_engine
from mathesar.database.utils import get_non_default_database_keys
from db.tables import get_table_oids_from_schema
from db.schemas import get_mathesar_schemas_with_oids
# We import the entire models module to avoid a circular import error
from mathesar import models

DB_REFLECTION_KEY = 'database_reflected_recently'
DB_REFLECTION_INTERVAL = 60 * 5  # we reflect DB changes every 5 minutes


def reflect_databases():
    databases = set(settings.DATABASES)
    # We only want to track non-django dbs
    databases.remove('default')

    # Update deleted databases
    for database in models.Database.current_objects.all():
        if database.name in databases:
            databases.remove(database.name)
        else:
            database.deleted = True
            models.Schema.current_objects.filter(database=database).delete()
            database.save()

    # Create databases that aren't models yet
    for database in databases:
        models.Database.current_objects.create(name=database)


def reflect_schemas_from_database(database):
    engine = create_mathesar_engine(database)
    db_schema_oids = {
        schema["oid"] for schema in get_mathesar_schemas_with_oids(engine)
    }

    database = models.Database.current_objects.get(name=database)
    schemas = [
        models.Schema.current_objects.get_or_create(oid=oid, database=database)
        for oid in db_schema_oids
    ]
    for schema in models.Schema.current_objects.all():
        if schema.database.name == database and schema.oid not in db_schema_oids:
            schema.delete()
    return schemas


def reflect_tables_from_schema(schema):
    db_table_oids = {
        table["oid"]
        for table in get_table_oids_from_schema(schema.oid, schema._sa_engine)
    }
    tables = [
        models.Table.current_objects.get_or_create(oid=oid, schema=schema)
        for oid in db_table_oids
    ]
    for table in models.Table.current_objects.all().filter(schema=schema):
        if table.oid not in db_table_oids:
            table.delete()
    return tables


def reflect_db_objects():
    if not cache.get(DB_REFLECTION_KEY):
        reflect_databases()
        for database_key in get_non_default_database_keys():
            reflect_schemas_from_database(database_key)
        for schema in models.Schema.current_objects.all():
            reflect_tables_from_schema(schema)
        cache.set(DB_REFLECTION_KEY, True, DB_REFLECTION_INTERVAL)
