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
from mathesar.imports.utils import get_alternate_column_names, process_column_names
from psycopg2.errors import IntegrityError, DataError
from sqlalchemy.exc import IntegrityError as sqlalchemy_integrity_error


def is_valid_json(data):
    try:
        json.loads(data)
    except (JSONDecodeError, ValueError):
        return False
    return True


def validate_json_format(data_file_content):
    try:
        data = json.load(data_file_content)
    except (JSONDecodeError, ValueError) as e:
        raise database_api_exceptions.InvalidJSONFormat(e)

    is_list_of_dicts = isinstance(data, list) and all(isinstance(val, dict) for val in data)
    if is_list_of_dicts:
        return
    if isinstance(data, dict):
        return
    raise database_api_exceptions.UnsupportedJSONFormat()


def get_flattened_keys(json_dict, max_level, prefix=''):
    keys = []
    for key, value in json_dict.items():
        flattened_key = f"{prefix}{key}"
        if isinstance(value, dict) and max_level > 0:
            keys += get_flattened_keys(value, max_level - 1, f"{flattened_key}.")
        else:
            keys.append(flattened_key)
    return keys


def get_column_names_from_json(data_file, max_level):
    with open(data_file, 'r') as f:
        data = json.load(f)

    if isinstance(data, list):
        all_keys = []
        for obj in data:
            for key in get_flattened_keys(obj, max_level):
                if key not in all_keys:
                    all_keys.append(key)
        return all_keys
    else:
        return get_flattened_keys(data, max_level)


def insert_records_from_json_data_file(name, schema, column_names, engine, comment, json_filepath, max_level):
    table = create_string_column_table(
        name=name,
        schema_oid=schema.oid,
        column_names=column_names,
        engine=engine,
        comment=comment,
    )
    insert_records_from_json(
        table,
        engine,
        json_filepath,
        column_names,
        max_level
    )
    return table


def create_db_table_from_json_data_file(data_file, name, schema, comment=None):
    db_model = schema.database
    engine = create_mathesar_engine(db_model)
    json_filepath = data_file.file.path
    max_level = data_file.max_level
    column_names = process_column_names(
        get_column_names_from_json(json_filepath, max_level)
    )
    try:
        table = insert_records_from_json_data_file(name, schema, column_names, engine, comment, json_filepath, max_level)
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError, sqlalchemy_integrity_error):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = get_alternate_column_names(column_names)
        table = insert_records_from_json_data_file(name, schema, column_names_alt, engine, comment, json_filepath, max_level)

    return table
