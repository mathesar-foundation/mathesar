from django.conf import settings
from django.core.cache import cache

from db.constraints.operations.select import get_constraints_with_oids
from db.schemas import get_mathesar_schemas_with_oids
from db.tables.utils import get_table_oids_from_schema
# We import the entire models module to avoid a circular import error
from mathesar import models
from mathesar.database.base import create_mathesar_engine

DB_REFLECTION_KEY = 'database_reflected_recently'
DB_REFLECTION_INTERVAL = 60 * 5  # we reflect DB changes every 5 minutes


# NOTE: All querysets used for reflection should use the .current_objects manager
# instead of the .objects manger. The .objects manager calls reflect_db_objects when a
# queryset is created, and will recurse if used in these functions.


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
        schema['oid'] for schema in get_mathesar_schemas_with_oids(engine)
    }

    database = models.Database.current_objects.get(name=database)
    for oid in db_schema_oids:
        models.Schema.current_objects.get_or_create(oid=oid, database=database)
    for schema in models.Schema.current_objects.all():
        if schema.database.name == database and schema.oid not in db_schema_oids:
            schema.delete()


def reflect_tables_from_schema(schema):
    db_table_oids = {
        table['oid']
        for table in get_table_oids_from_schema(schema.oid, schema._sa_engine)
    }
    for oid in db_table_oids:
        models.Table.current_objects.get_or_create(oid=oid, schema=schema)
    for table in models.Table.current_objects.filter(schema=schema):
        if table.oid not in db_table_oids:
            table.delete()


def reflect_constraints_from_database(database):
    engine = create_mathesar_engine(database)
    db_constraints = get_constraints_with_oids(engine)
    for db_constraint in db_constraints:
        try:
            table = models.Table.current_objects.get(oid=db_constraint['conrelid'])
        except models.Table.DoesNotExist:
            continue
        models.Constraint.current_objects.get_or_create(oid=db_constraint['oid'], table=table)
    for constraint in models.Constraint.current_objects.all():
        if constraint.oid not in [db_constraint['oid'] for db_constraint in db_constraints]:
            constraint.delete()


def reflect_new_table_constraints(table):
    engine = create_mathesar_engine(table.schema.database.name)
    db_constraints = get_constraints_with_oids(engine, table_oid=table.oid)
    constraints = [
        models.Constraint.current_objects.get_or_create(
            oid=db_constraint['oid'],
            table=table
        )
        for db_constraint in db_constraints
    ]
    return constraints


def reflect_db_objects():
    if not cache.get(DB_REFLECTION_KEY):
        reflect_databases()
        for database in models.Database.current_objects.filter(deleted=False):
            reflect_schemas_from_database(database.name)
        for schema in models.Schema.current_objects.all():
            reflect_tables_from_schema(schema)
        reflect_constraints_from_database(database.name)
        cache.set(DB_REFLECTION_KEY, True, DB_REFLECTION_INTERVAL)
