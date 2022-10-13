from sqlalchemy import MetaData

from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import get_oid_from_table
from db.tables.operations.infer_types import infer_table_column_types
from mathesar.database.base import create_mathesar_engine
from mathesar.imports.csv import create_table_from_csv
from mathesar.models.base import Table
from mathesar.state.django import reflect_columns_from_tables
from mathesar.state import get_cached_metadata

TABLE_NAME_TEMPLATE = 'Table'

POSTGRES_NAME_LEN_CAP = 63


def get_table_column_types(table):
    schema = table.schema
    db_types = infer_table_column_types(schema.name, table.name, schema._sa_engine)
    col_types = {
        col.name: db_type.id
        for col, db_type in zip(table.sa_columns, db_types)
        if not col.is_default
        and not col.primary_key
        and not col.foreign_keys
    }
    return col_types


def gen_table_name(schema, data_files=None):
    if data_files:
        data_file = data_files[0]
        base_name = data_file.base_name
    else:
        base_name = None

    if base_name and len(base_name) >= POSTGRES_NAME_LEN_CAP - 8:
        # Ensures we have at least 7 digits to work with
        base_name = None

    if not base_name:
        base_name = TABLE_NAME_TEMPLATE
        table_num = Table.objects.count()
        name = f'{TABLE_NAME_TEMPLATE} {table_num}'
    else:
        table_num = 0
        name = base_name

    metadata = MetaData(bind=schema._sa_engine, schema=schema.name)
    metadata.reflect()
    while '.'.join((schema.name, name)) in metadata.tables:
        table_num += 1
        name = f'{base_name} {table_num}'
        if len(name) > POSTGRES_NAME_LEN_CAP:
            base_name = base_name[:-1]
            name = base_name + f' {table_num}'
    return name


def create_table_from_datafile(data_files, name, schema, comment=None):
    data_file = data_files[0]
    table = create_table_from_csv(data_file, name, schema, comment=comment)
    return table


def create_empty_table(name, schema, comment=None):
    """
    Create an empty table, with only Mathesar's internal columns.

    :param name: the parsed and validated table name
    :param schema: the parsed and validated schema model
    :return: the newly created blank table
    """
    engine = create_mathesar_engine(schema.database.name)
    db_table = create_mathesar_table(name, schema.name, [], engine, comment=comment)
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    # Using current_objects to create the table instead of objects. objects
    # triggers re-reflection, which will cause a race condition to create the table
    table, _ = Table.current_objects.get_or_create(oid=db_table_oid, schema=schema)
    reflect_columns_from_tables([table], metadata=get_cached_metadata())
    return table
