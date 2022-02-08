"""
This file maps "friendly" Mathesar data types to Postgres database types.
Mathesar data types are shown in the UI.
"""
from enum import Enum

from db.types.base import (
    PostgresType, MathesarCustomType, get_available_types, get_qualified_name,
    get_db_type_name, db_types_hinted, get_db_type_enum_from_id
    )


class MathesarTypeIdentifier(Enum):
    BOOLEAN = 'boolean'
    DATETIME = 'datetime'
    DURATION = 'duration'
    EMAIL = 'email'
    MONEY = 'money'
    NUMBER = 'number'
    TEXT = 'text'
    URI = 'uri'
    # These are default Postgres types that we don't have specific behavior for yet in the UI.
    OTHER = 'other'
    # These are types that we don't know anything about.
    CUSTOM = 'custom'


def _get_mapped_types(type_map):
    mapped_types = []
    for type_dict in type_map:
        for sa_type in type_dict['sa_type_names']:
            mapped_types.append(sa_type)
    return mapped_types


def _get_other_types(type_map):
    mapped_types = _get_mapped_types(type_map)
    return {
        'identifier': MathesarTypeIdentifier.OTHER.value,
        'name': 'Other',
        'sa_type_names': [pg_type.value for pg_type in PostgresType if pg_type.value not in mapped_types]
    }


def _get_type_map():
    type_map = [{
        'identifier': MathesarTypeIdentifier.BOOLEAN.value,
        'name': 'Boolean',
        'sa_type_names': [PostgresType.BOOLEAN.value]
    }, {
        'identifier': MathesarTypeIdentifier.DATETIME.value,
        'name': 'Date & Time',
        'sa_type_names': [
            PostgresType.DATE.value,
            PostgresType.TIME_WITH_TIME_ZONE.value,
            PostgresType.TIME_WITHOUT_TIME_ZONE.value,
            PostgresType.TIMESTAMP_WITH_TIME_ZONE.value,
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE.value
        ]
    }, {
        'identifier': MathesarTypeIdentifier.DURATION.value,
        'name': 'Duration',
        'sa_type_names': [PostgresType.INTERVAL.value]
    }, {
        'identifier': MathesarTypeIdentifier.EMAIL.value,
        'name': 'Email',
        'sa_type_names': [get_qualified_name(MathesarCustomType.EMAIL.value)]
    }, {
        'identifier': MathesarTypeIdentifier.MONEY.value,
        'name': 'Money',
        'sa_type_names': [
            PostgresType.MONEY.value,
            get_qualified_name(MathesarCustomType.MONEY.value)
        ]
    }, {
        'identifier': MathesarTypeIdentifier.NUMBER.value,
        'name': 'Number',
        'sa_type_names': [
            PostgresType.BIGINT.value,
            PostgresType.DECIMAL.value,
            PostgresType.DOUBLE_PRECISION.value,
            PostgresType.FLOAT.value,
            PostgresType.INTEGER.value,
            PostgresType.NUMERIC.value,
            PostgresType.REAL.value,
            PostgresType.SMALLINT.value
        ]
    }, {
        'identifier': MathesarTypeIdentifier.TEXT.value,
        'name': 'Text',
        'sa_type_names': [
            PostgresType.CHAR.value,
            PostgresType.CHARACTER.value,
            PostgresType.CHARACTER_VARYING.value,
            PostgresType.NAME.value,
            PostgresType.TEXT.value,
        ]
    }, {
        'identifier': MathesarTypeIdentifier.URI.value,
        'name': 'URI',
        'sa_type_names': [get_qualified_name(MathesarCustomType.URI.value)]
    }]
    type_map.append(_get_other_types(type_map))
    return type_map


def _get_custom_types(type_map, installed_types):
    mapped_types = _get_mapped_types(type_map)
    return {
        'identifier': MathesarTypeIdentifier.CUSTOM.value,
        'name': 'Custom',
        'sa_type_names': [db_type for db_type in installed_types.keys() if db_type not in mapped_types]
    }


def _ignore_type(sa_type_name):
    # We ignore these types since they're internal to SQLAlchemy
    IGNORED_TYPES = [
        PostgresType._ARRAY.value,
        PostgresType.CHAR.value,
        PostgresType.NAME.value,
    ]
    if sa_type_name in IGNORED_TYPES:
        return True
    return False


def find_ma_type_that_satisfies_hintset(ma_types_mapped_to_hintsets, hintset):
    """
    Provided a mapping of Mathesar types to their hintsets and a hintset, tries to find a Mathesar
    type whose hintset satisfies the passed hintset, meaning the Mathesar type whose hintset is a
    superset of the passed hintset.
    """
    hintset = set(hintset)
    for ma_type, ma_type_hintset in ma_types_mapped_to_hintsets:
        ma_type_satisfies_hintset = set.issubset(hintset, ma_type_hintset)
        if ma_type_satisfies_hintset:
            return ma_type
    return None



def get_ma_types_mapped_to_hintsets(engine):
    """
    Returns a dict where the keys are Mathesar types and the values their hintsets.
    A Mathesar type's hintset is defined as the intersection of the hintsets of its associated
    database types.
    """
    type_descriptions = get_types(engine)
    ma_types_mapped_to_hintsets = {}
    for type_description in type_descriptions:
        type = get_db_type_enum_from_id(type_description['identifier'])
        associated_db_type_descriptions = type_description['db_types']
        associated_db_types = (
            get_db_type_enum_from_id(associated_db_type_description['sa_type'])
            for associated_db_type_description in associated_db_type_descriptions
        )
        associated_db_type_hintsets = (
            set(db_types_hinted[associated_db_type])
            for associated_db_type in associated_db_types
            if associated_db_type in db_types_hinted
        )
        hintsets_intersection = set.intersection(associated_db_type_hintsets)
        ma_types_mapped_to_hintsets[type] = tuple(hintsets_intersection)
    return ma_types_mapped_to_hintsets


# TODO improve readability
# TODO improve naming (e.g. what's the difference between sa_type_name and sa_type?)
def get_types(engine):
    """
    Returns a sequence of dicts describing Mathesar types supported by the database
    associated with the provided engine. It has the following structure:

    ```
    [
        dict(
            identifier,
            name,
            db_types=[
                dict(sa_type_name, sa_type),
                dict(sa_type_name, sa_type),
                ...
            ]
        ),
        ...
    ]
    ```
    """
    types = []
    installed_types = get_available_types(engine)
    type_map = _get_type_map()
    type_map.append(_get_custom_types(type_map, installed_types))
    for type_dict in type_map:
        type_info = {
            'identifier': type_dict['identifier'],
            'name': type_dict['name'],
            'db_types': {}
        }
        for sa_type_name in type_dict['sa_type_names']:
            if sa_type_name in installed_types and (not _ignore_type(sa_type_name)):
                sa_type = installed_types[sa_type_name]
                db_type = get_db_type_name(sa_type, engine)
                sa_type_info = {
                    'sa_type_name': sa_type_name,
                    'sa_type': sa_type,
                }
                if db_type in type_info['db_types']:
                    type_info['db_types'][db_type].append(sa_type_info)
                else:
                    type_info['db_types'][db_type] = [sa_type_info]
        types.append(type_info)
    return types


def get_sa_type_map():
    sa_types_map = {}
    for type_map in _get_type_map():
        mathesar_type = type_map['identifier']
        for sa_type in type_map['sa_type_names']:
            sa_types_map[sa_type] = mathesar_type
    return sa_types_map


def get_mathesar_type_from_db_type(db_type_string):
    type_map = get_sa_type_map()
    return type_map[db_type_string.lower()]
