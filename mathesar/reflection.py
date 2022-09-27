from collections import defaultdict

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

DB_REFLECTION_KEY = 'database_reflected_recently'
# TODO Change this back to 60 * 5 later in the development process
DB_REFLECTION_INTERVAL = 1  # we reflect DB changes every second


# NOTE: All querysets used for reflection should use the .current_objects manager
# instead of the .objects manger. The .objects manager calls reflect_db_objects when a
# queryset is created, and will recurse if used in these functions.


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


# TODO creating a one-off engine is expensive
def reflect_schemas_from_database(database_name):
    engine = create_mathesar_engine(database_name)
    db_schema_oids = {
        schema['oid'] for schema in get_mathesar_schemas_with_oids(engine)
    }

    database = models.Database.current_objects.get(name=database_name)
    schemas = []
    for oid in db_schema_oids:
        schema = models.Schema(oid=oid, database=database)
        schemas.append(schema)
    models.Schema.current_objects.bulk_create(schemas, ignore_conflicts=True)
    deleted_schemas = []
    for schema in models.Schema.current_objects.all().select_related('database'):
        if schema.database.name == database and schema.oid not in db_schema_oids:
            deleted_schemas.append(schema.id)
    models.Schema.current_objects.filter(id__in=deleted_schemas).delete()
    engine.dispose()


def reflect_tables_from_schemas(schemas):
    if len(schemas) < 1:
        return
    engine = schemas[0]._sa_engine
    schema_oids = [schema.oid for schema in schemas]
    db_table_oids = {
        (table['oid'], table['schema_oid'])
        for table in get_table_oids_from_schema(schema_oids, engine)
    }
    tables = []
    for oid, schema_oid in db_table_oids:
        schema = next(schema for schema in schemas if schema.oid == schema_oid)
        table = models.Table(oid=oid, schema=schema)
        tables.append(table)
    models.Table.current_objects.bulk_create(tables, ignore_conflicts=True)
    # Calling signals manually because bulk create does not emit any signals
    models._create_table_settings(models.Table.current_objects.filter(settings__isnull=True))
    deleted_tables = []
    for table in models.Table.current_objects.filter(schema__in=schemas).select_related('schema'):
        if (table.oid, table.schema.oid) not in db_table_oids:
            deleted_tables.append(table.id)

    models.Table.current_objects.filter(id__in=deleted_tables).delete()


def reflect_columns_from_tables(tables):
    if len(tables) < 1:
        return
    engine = tables[0]._sa_engine
    table_oids = [table.oid for table in tables]
    # We need it later for creating only newly created columns
    existing_columns = list(models.Column.current_objects.filter(table__in=tables).values_list('id', flat=True))
    # Using dictionary as it maintains insertions ordered
    attnums = {
        column['attnum']: column['table_oid']
        for column in get_column_attnums_from_table(table_oids, engine)
    }
    columns = []
    for attnum, table_oid in attnums.items():
        table = next(table for table in tables if table.oid == table_oid)
        column = models.Column(attnum=attnum, table=table, display_options=None)
        columns.append(column)
    models.Column.current_objects.bulk_create(columns, ignore_conflicts=True)
    attnums_mapped_by_table_oid = defaultdict(list)
    for attnum, table_oid in attnums.items():
        attnums_mapped_by_table_oid[table_oid].append(attnum)

    stale_columns_queryset = models.Column.current_objects
    for table_oid, attnums in attnums_mapped_by_table_oid.items():
        table = next(table for table in tables if table.oid == table_oid)
        stale_columns_queryset = stale_columns_queryset.filter(Q(table=table) & ~Q(attnum__in=attnums))
    stale_columns_queryset.delete()
    new_columns = models.Column.current_objects.filter(~Q(id__in=existing_columns) & Q(table__in=tables))
    for new_column in new_columns:
        models._compute_preview_template(new_column)
    columns_with_invalid_display_option = []
    for column in columns:
        if column.display_options:
            # If the type of column has changed, existing display options won't be valid anymore.
            serializer = DisplayOptionsMappingSerializer(
                data=column.display_options,
                context={DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY: column.db_type}
            )
            if not serializer.is_valid(False):
                columns_with_invalid_display_option.append(column.id)
    if len(columns_with_invalid_display_option) > 0:
        models.Column.current_objects.filter(id__in=columns_with_invalid_display_option).update(display_options=None)


# TODO creating a one-off engine is expensive
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


# TODO creating a one-off engine is expensive
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


def reflect_db_objects(skip_cache_check=False):
    if skip_cache_check or not cache.get(DB_REFLECTION_KEY):
        reflect_databases()
        for database in models.Database.current_objects.filter(deleted=False):
            reflect_schemas_from_database(database.name)
        # Prefetching queries make use of a single db engine, so we need to
        for database in models.Database.current_objects.filter(deleted=False):
            schemas = models.Schema.current_objects.filter(database=database)
            reflect_tables_from_schemas(schemas)
            tables = models.Table.current_objects.filter(schema__in=schemas).prefetch_related('schema')
            reflect_columns_from_tables(tables)
            reflect_constraints_from_database(database.name)
        cache.set(DB_REFLECTION_KEY, True, DB_REFLECTION_INTERVAL)
