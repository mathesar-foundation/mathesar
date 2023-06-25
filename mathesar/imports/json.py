import json
from json.decoder import JSONDecodeError

from db.tables.operations.alter import update_pk_sequence_to_latest
from mathesar.database.base import create_mathesar_engine
from db.records.operations.insert import insert_records_from_json
from db.tables.operations.create import create_string_column_table
from db.tables.operations.drop import drop_table
from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions
)
from mathesar.imports.utils import process_column_names
from db.constants import ID, ID_ORIGINAL
from psycopg2.errors import IntegrityError, DataError

from mathesar.state import reset_reflection


def validate_json_format(data_file_content):
    try:
        data = json.load(data_file_content)
    except (JSONDecodeError, ValueError) as e:
        raise database_api_exceptions.InvalidJSONFormat(e)

    if not (isinstance(data, list) or isinstance(data, dict)):
        raise database_api_exceptions.UnsupportedJSONFormat()


def get_column_names_from_json(data_file):
    with open(data_file, 'r') as f:
        validate_json_format(f)
        data = json.load(f)

    if isinstance(data, list):
        all_keys = []
        for obj in data:
            for key in obj.keys():
                if key not in all_keys:
                    all_keys.append(key)
        return all_keys
    else:
        return list(data.keys())


def insert_data_from_json_data_file(name, schema, column_names, engine, comment, json_filepath):
    table = create_string_column_table(
        name=name,
        schema=schema.name,
        column_names=column_names,
        engine=engine,
        comment=comment,
    )
    insert_records_from_json(
        table,
        engine,
        json_filepath,
        column_names
    )
    return table


def create_db_table_from_json_data_file(data_file, name, schema, comment=None):
    db_name = schema.database.name
    engine = create_mathesar_engine(db_name)
    json_filepath = data_file.file.path
    column_names = process_column_names(
        get_column_names_from_json(json_filepath)
    )
    try:
        table = insert_data_from_json_data_file(name, schema, column_names, engine, comment, json_filepath)
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = [
            fieldname if fieldname != ID else ID_ORIGINAL
            for fieldname in column_names
        ]
        table = insert_data_from_json_data_file(name, schema, column_names_alt, engine, comment, json_filepath)

    reset_reflection(db_name=db_name)
    return table
