import logging
from collections import defaultdict

from django.conf import settings
from django.core.cache import cache as dj_cache
from django.db.models import Prefetch, Q

from db.columns.operations.select import get_column_attnums_from_tables
from db.constraints.operations.select import get_constraints_with_oids
from db.schemas.operations.select import get_mathesar_schemas_with_oids
from db.tables.operations.select import get_table_oids_from_schemas
# We import the entire models.base module to avoid a circular import error
from mathesar.models import base as models
from mathesar.api.serializers.shared_serializers import DisplayOptionsMappingSerializer, \
    DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY
from mathesar.database.base import create_mathesar_engine


logger = logging.getLogger(__name__)


def clear_dj_cache():
    logger.debug('clear_dj_cache')
    dj_cache.clear()


# NOTE: All querysets used for reflection should use the .current_objects manager
# instead of the .objects manger. The .objects manager calls reflect_db_objects when a
# queryset is created, and will recurse if used in these functions.


def reflect_db_objects(metadata):
    reflect_databases()
    databases = models.Database.current_objects.filter(deleted=False)
    for database in databases:
        reflect_schemas_from_database(database)
        schemas = models.Schema.current_objects.filter(database=database).prefetch_related(
            Prefetch('database', queryset=databases)
        )
        reflect_tables_from_schemas(schemas, metadata=metadata)
        tables = models.Table.current_objects.filter(schema__in=schemas).prefetch_related(
            Prefetch('schema', queryset=schemas)
        )
        reflect_columns_from_tables(tables, metadata=metadata)
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
def reflect_schemas_from_database(database):
    engine = create_mathesar_engine(database.name)
    db_schema_oids = {
        schema['oid'] for schema in get_mathesar_schemas_with_oids(engine)
    }

    schemas = []
    for oid in db_schema_oids:
        schema = models.Schema(oid=oid, database=database)
        schemas.append(schema)
    models.Schema.current_objects.bulk_create(schemas, ignore_conflicts=True)
    for schema in models.Schema.current_objects.all().select_related('database'):
        if schema.database == database and schema.oid not in db_schema_oids:
            # Deleting Schemas are a rare occasion, not worth deleting in bulk
            schema.delete()
    engine.dispose()


def reflect_tables_from_schemas(schemas, metadata):
    if len(schemas) < 1:
        return
    engine = schemas[0]._sa_engine
    schema_oids = [schema.oid for schema in schemas]
    db_table_oids = {
        (table['oid'], table['schema_oid'])
        for table in get_table_oids_from_schemas(schema_oids, engine, metadata=metadata)
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


def reflect_columns_from_tables(tables, metadata):
    if len(tables) < 1:
        return
    engine = tables[0]._sa_engine
    table_oids = [table.oid for table in tables]
    attnum_tuples = get_column_attnums_from_tables(table_oids, engine, metadata=metadata)

    _create_reflected_columns(attnum_tuples, tables)

    _delete_stale_columns(attnum_tuples, tables)
    # Manually trigger preview templates computation signal
    for table in tables:
        models._compute_preview_template(table)

    _invalidate_columns_with_incorrect_display_options(tables)


def _invalidate_columns_with_incorrect_display_options(tables):
    columns_with_invalid_display_option = []
    columns = models.Column.current_objects.filter(table__in=tables)
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


def _create_reflected_columns(attnum_tuples, tables):
    columns = []
    for attnum, table_oid in attnum_tuples:
        table = next(table for table in tables if table.oid == table_oid)
        column = models.Column(attnum=attnum, table=table, display_options=None)
        columns.append(column)
    models.Column.current_objects.bulk_create(columns, ignore_conflicts=True)


def _delete_stale_columns(attnum_tuples, tables):
    attnums_mapped_by_table_oid = defaultdict(list)
    for attnum, table_oid in attnum_tuples:
        attnums_mapped_by_table_oid[table_oid].append(attnum)
    stale_columns_queryset = models.Column.current_objects
    for table_oid, attnums in attnums_mapped_by_table_oid.items():
        table = next(table for table in tables if table.oid == table_oid)
        stale_columns_queryset = stale_columns_queryset.filter(Q(table=table) & ~Q(attnum__in=attnums))
    stale_columns_queryset.delete()


# TODO pass in a cached engine instead of creating a new one
def reflect_constraints_from_database(database):
    engine = create_mathesar_engine(database)
    db_constraints = get_constraints_with_oids(engine)
    map_of_table_oid_to_constraint_oids = defaultdict(list)
    for db_constraint in db_constraints:
        table_oid = db_constraint['conrelid']
        constraint_oid = db_constraint['oid']
        map_of_table_oid_to_constraint_oids[table_oid].append(constraint_oid)

    table_oids = map_of_table_oid_to_constraint_oids.keys()
    tables = models.Table.current_objects.filter(oid__in=table_oids)
    constraint_objs_to_create = []
    for table in tables:
        constraint_oids = map_of_table_oid_to_constraint_oids.get(table.oid, [])
        for constraint_oid in constraint_oids:
            constraint_obj = models.Constraint(oid=constraint_oid, table=table)
            constraint_objs_to_create.append(constraint_obj)
    models.Constraint.current_objects.bulk_create(constraint_objs_to_create, ignore_conflicts=True)

    stale_constraint_ids = []
    for constraint in models.Constraint.current_objects.all():
        if constraint.oid not in [db_constraint['oid'] for db_constraint in db_constraints]:
            stale_constraint_ids.append(constraint.id)
    models.Constraint.current_objects.filter(id__in=stale_constraint_ids).delete()
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
