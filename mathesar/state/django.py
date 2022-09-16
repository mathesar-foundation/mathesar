from django.conf import settings
from django.core.cache import cache
from django.db.models import Q

from db.columns.operations.select import get_column_attnums_from_table
from db.constraints.operations.select import get_constraints_with_oids
from db.schemas.operations.select import get_mathesar_schemas_with_oids
from db.tables.operations.select import get_table_oids_from_schema
# We import the entire models.base module to avoid a circular import error
from mathesar.models import base as models
from mathesar.api.serializers.shared_serializers import DisplayOptionsMappingSerializer, \
    DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY
from mathesar.database.base import create_mathesar_engine


# NOTE: All querysets used for reflection should use the .current_objects manager
# instead of the .objects manger. The .objects manager calls reflect_db_objects when a
# queryset is created, and will recurse if used in these functions.


import logging
logger = logging.getLogger(__name__)
def reflect_db_objects(metadata, skip_cache_check=False):
    logger.debug('reflect_db_objects called.')
    reflect_databases()
    for database in models.Database.current_objects.filter(deleted=False):
        reflect_schemas_from_database(database.name)
    for schema in models.Schema.current_objects.all():
        reflect_tables_from_schema(schema, metadata=metadata)
    for table in models.Table.current_objects.all():
        reflect_columns_from_table(table, metadata=metadata)
    # TODO where is the database variable coming from? someone explain how this even runs.
    for database in models.Database.current_objects.filter(deleted=False):
        reflect_constraints_from_database(database.name)


def reflect_databases():
    dbs_in_settings = set(settings.DATABASES)
    # We only want to track non-django dbs
    dbs_in_settings.remove('default')

    # Ignore dbs that are models; update deleted databases
    for database in models.Database.current_objects.all():
        if database.name in dbs_in_settings:
            dbs_in_settings.remove(database.name)
        else:
            database.deleted = True
            models.Schema.current_objects.filter(database=database).delete()
            database.save()

    # Create databases that aren't models yet
    for db_name in dbs_in_settings:
        models.Database.current_objects.create(name=db_name)


# TODO pass in a cached engine instead of creating a new one
def reflect_schemas_from_database(database_name):
    engine = create_mathesar_engine(database_name)
    db_schema_oids = {
        schema['oid'] for schema in get_mathesar_schemas_with_oids(engine)
    }

    database = models.Database.current_objects.get(name=database_name)
    for oid in db_schema_oids:
        schema, _ = models.Schema.current_objects.get_or_create(oid=oid, database=database)
    for schema in models.Schema.current_objects.all():
        if schema.database.name == database and schema.oid not in db_schema_oids:
            schema.delete()
    engine.dispose()


def reflect_tables_from_schema(schema, metadata):
    db_table_oids = {
        table['oid']
        for table in get_table_oids_from_schema(
            schema_oid=schema.oid,
            engine=schema._sa_engine,
            metadata=metadata,
        )
    }
    for oid in db_table_oids:
        models.Table.current_objects.get_or_create(oid=oid, schema=schema)
    for table in models.Table.current_objects.filter(schema=schema):
        if table.oid not in db_table_oids:
            table.delete()


def reflect_columns_from_table(table, metadata):
    attnums = {
        column['attnum']
        for column in get_column_attnums_from_table(table.oid, table.schema._sa_engine, metadata=metadata)
    }
    for attnum in attnums:
        column, created = models.Column.current_objects.get_or_create(
            attnum=attnum,
            table=table,
            defaults={'display_options': None})
        if not created and column.display_options:
            # If the type of column has changed, existing display options won't be valid anymore.
            serializer = DisplayOptionsMappingSerializer(
                data=column.display_options,
                context={DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY: column.db_type}
            )
            if not serializer.is_valid(False):
                column.display_options = None
                column.save()
    models.Column.current_objects.filter(table=table).filter(~Q(attnum__in=attnums)).delete()


# TODO pass in a cached engine instead of creating a new one
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
    engine.dispose()


# TODO pass in a cached engine instead of creating a new one
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
    engine.dispose()
    return constraints
