import json
from json.decoder import JSONDecodeError

from db.tables.operations.alter import update_pk_sequence_to_latest
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
