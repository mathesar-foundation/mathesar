import json

from db.identifiers import truncate_if_necessary
from db.tables.operations.alter import update_pk_sequence_to_latest
from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Table
from db.records.operations.insert import insert_records_from_json
from db.tables.operations.create import create_string_column_table
from db.tables.operations.select import get_oid_from_table
from db.tables.operations.drop import drop_table
from db.constants import ID, ID_ORIGINAL, COLUMN_NAME_TEMPLATE
from psycopg2.errors import IntegrityError, DataError

from mathesar.state import reset_reflection


def get_column_names_from_json(data_file):
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        return list(data[0].keys())
    return list(data.keys())


def _process_column_names(column_names):
    column_names = (
        column_name.strip()
        for column_name
        in column_names
    )
    column_names = (
        truncate_if_necessary(column_name)
        for column_name
        in column_names
    )
    column_names = (
        f"{COLUMN_NAME_TEMPLATE}{i}" if name == '' else name
        for i, name
        in enumerate(column_names)
    )
    return list(column_names)


def create_db_table_from_json_data_file(data_file, name, schema, comment=None):
    db_name = schema.database.name
    engine = create_mathesar_engine(db_name)
    json_filepath = data_file.file.path
    column_names = _process_column_names(
        get_column_names_from_json(data_file.file.path)
    )
    table = create_string_column_table(
        name=name,
        schema=schema.name,
        column_names=column_names,
        engine=engine,
        comment=comment,
    )
    try:
        insert_records_from_json(
            table,
            engine,
            json_filepath
        )
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = [
            fieldname if fieldname != ID else ID_ORIGINAL
            for fieldname in column_names
        ]
        table = create_string_column_table(
            name=name,
            schema=schema.name,
            column_names=column_names_alt,
            engine=engine,
            comment=comment,
        )
        insert_records_from_json(
            table,
            engine,
            json_filepath
        )
    reset_reflection(db_name=db_name)
    return table


def create_table_from_json(data_file, name, schema, comment=None):
    engine = create_mathesar_engine(schema.database.name)
    db_table = create_db_table_from_json_data_file(
        data_file, name, schema, comment=comment
    )
    db_table_oid = get_oid_from_table(
        db_table.name, db_table.schema, engine
    )
    table = Table.current_objects.get(
        oid=db_table_oid,
        schema=schema,
    )
    table.import_verified = False
    table.save()
    data_file.table_imported_to = table
    data_file.save()
    return table
