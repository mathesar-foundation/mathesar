"""
This file maps "friendly" Mathesar data types to Postgres database types.
Mathesar data types are shown in the UI.
"""
from enum import Enum

from db.types.base import (
    DatabaseType, PostgresType, MathesarCustomType, get_available_known_db_types,
    get_qualified_name, db_types_hinted,
)

from copy import deepcopy

from collections.abc import Sequence, Mapping, MutableSequence


class MathesarType(Enum):
    BOOLEAN = 'boolean'
    DATETIME = 'datetime'
    TIME = 'time'
    DATE = 'date'
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


def _get_mapped_types(type_map) -> Sequence[DatabaseType]:
    """
    Returns the db types mentioned in given type_map.
    """
    mapped_types = []
    for type_dict in type_map:
        for db_type in type_dict['db_types']:
            mapped_types.append(db_type)
    return mapped_types


def _get_other_types(type_map) -> dict:
    mapped_types = _get_mapped_types(type_map)
    return {
        'ma_type': MathesarType.OTHER,
        'name': 'Other',
        'db_types': [pg_type for pg_type in PostgresType if pg_type not in mapped_types]
    }


def _get_type_map() -> MutableSequence[dict]:
    """
    Returns a sequence of Mathesar type descriptions.

    Notice that this mapping might include types that are unavailable on a given engine or that
    are ignored.
    """
    type_map = [{
        'ma_type': MathesarType.BOOLEAN,
        'name': 'Boolean',
        'db_types': [PostgresType.BOOLEAN]
    }, {
        'ma_type': MathesarType.DATE,
        'name': 'Date',
        'db_types': [
            PostgresType.DATE,
        ]
    }, {
        'ma_type': MathesarType.TIME,
        'name': 'Time',
        'db_types': [
            PostgresType.TIME_WITH_TIME_ZONE,
            PostgresType.TIME_WITHOUT_TIME_ZONE,
        ]
    }, {
        'ma_type': MathesarType.DATETIME,
        'name': 'Date & Time',
        'db_types': [
            PostgresType.TIMESTAMP_WITH_TIME_ZONE,
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE
        ]
    }, {
        'ma_type': MathesarType.DURATION,
        'name': 'Duration',
        'db_types': [PostgresType.INTERVAL]
    }, {
        'ma_type': MathesarType.EMAIL,
        'name': 'Email',
        'db_types': [get_qualified_name(MathesarCustomType.EMAIL)]
    }, {
        'ma_type': MathesarType.MONEY,
        'name': 'Money',
        'db_types': [
            PostgresType.MONEY,
            get_qualified_name(MathesarCustomType.MATHESAR_MONEY),
            get_qualified_name(MathesarCustomType.MULTICURRENCY_MONEY),
        ]
    }, {
        'ma_type': MathesarType.NUMBER,
        'name': 'Number',
        'db_types': [
            PostgresType.BIGINT,
            PostgresType.DECIMAL,
            PostgresType.DOUBLE_PRECISION,
            PostgresType.FLOAT,
            PostgresType.INTEGER,
            PostgresType.NUMERIC,
            PostgresType.REAL,
            PostgresType.SMALLINT
        ]
    }, {
        'ma_type': MathesarType.TEXT,
        'name': 'Text',
        'db_types': [
            PostgresType.CHARACTER,
            PostgresType.CHARACTER_VARYING,
            PostgresType.TEXT,
            PostgresType.NAME,
            PostgresType.CHAR,
        ]
    }, {
        'ma_type': MathesarType.URI,
        'name': 'URI',
        'db_types': [get_qualified_name(MathesarCustomType.URI)]
    }]
    type_map.append(_get_other_types(type_map))
    return type_map


def _get_custom_types(type_map, installed_types):
    """
    Describes the CUSTOM MA type that contains the db types whose set is the subtraction of db types
    mentioned in `type_map` from `installed_types`.
    """
    mapped_types = _get_mapped_types(type_map)
    return {
        'ma_type': MathesarType.CUSTOM,
        'name': 'Custom',
        'db_types': [db_type for db_type in installed_types.keys() if db_type not in mapped_types]
    }


def _is_ignored_type(db_type: DatabaseType):
    # We ignore these types since they're internal to SQLAlchemy
    #
    # NOTE: in response to above comment, CHAR and NAME are not actually internal to SA.
    # SA reflects columns with these types as SA String type classes, which makes them unusable
    # for our purposes (we can't distinguish them). That's the reason for ignoring them.
    IGNORED_TYPES = [
        PostgresType._ARRAY,
        PostgresType.CHAR,
        PostgresType.NAME,
    ]
    return db_type in IGNORED_TYPES


def ma_types_that_satisfy_hintset(ma_types_mapped_to_hintsets, hintset):
    """
    Provided a mapping of Mathesar types to their hintsets and a hintset, tries to find Mathesar
    types whose hintsets satisfy the passed hintset, meaning the Mathesar types whose hintsets are
    supersets of the passed hintset.
    """
    hintset = set(hintset)
    return tuple(
        ma_type
        for ma_type, ma_type_hintset
        in ma_types_mapped_to_hintsets.items()
        if set.issubset(hintset, ma_type_hintset)
    )


def get_ma_types_mapped_to_hintsets(engine):
    """
    Returns a dict where the keys are Mathesar types and the values their hintsets.
    A Mathesar type's hintset is defined as the intersection of the hintsets of its associated
    database types.
    """
    ma_type_descriptions = get_types(engine)
    ma_types_mapped_to_hintsets = {}
    for ma_type_description in ma_type_descriptions:
        ma_type = ma_type_description['ma_type']
        associated_db_types = ma_type_description['db_types']
        associated_db_type_hintsets = tuple(
            set(db_types_hinted[associated_db_type])
            for associated_db_type in associated_db_types
            if associated_db_type in db_types_hinted
        )
        hintsets_intersection = _safe_set_intersection(associated_db_type_hintsets)
        ma_types_mapped_to_hintsets[ma_type] = tuple(hintsets_intersection)
    return ma_types_mapped_to_hintsets


def _safe_set_intersection(sets):
    # set.intersection fails if it is not passed anything.
    if len(sets) > 0:
        return set.intersection(*sets)
    else:
        return set()


# TODO notice the awkwardness between _get_actual_type_map and _get_type_map
def _get_actual_type_map(engine) -> Sequence[Mapping]:
    installed_types = get_available_known_db_types(engine)
    type_map = _get_type_map()
    type_map.append(_get_custom_types(type_map, installed_types))
    return type_map


# TODO rename to get_ma_types: it's important to easily distinguish MA types referred to here from
# other types like DB or SA types.
def get_types(engine) -> Sequence[Mapping]:
    """
    Returns a sequence of dicts describing Mathesar types supported by the database associated with
    the provided engine. It has the same structure as the output of _get_type_map.
    """
    def filter_out_ignored_types(ma_type_desc) -> Mapping:
        db_types = ma_type_desc["db_types"]
        filtered_db_types = tuple(
            db_type
            for db_type
            in db_types
            if (not db_type.is_ignored) and (not _is_ignored_type(db_type))
        )
        ma_type_desc["db_types"] = filtered_db_types
        return ma_type_desc
    ma_type_descriptions = _get_actual_type_map(engine)
    ma_type_descriptions = deepcopy(ma_type_descriptions)
    return tuple(
        filter_out_ignored_types(ma_type_desc)
        for ma_type_desc
        in ma_type_descriptions
    )


def _get_db_types_to_mathesar_types_iterator():
    """
    Returns an iterator of (db_type, ma_type) pairs, where the db_type is associated with the
    ma_type. We use an iterator for its laziness.
    """
    return (
        (db_type, ma_type_desc['ma_type'])
        for ma_type_desc
        in _get_type_map()
        for db_type
        in ma_type_desc['db_types']
    )


def get_mathesar_type_from_db_type(db_type_to_find: DatabaseType) -> MathesarType | None:
    for db_type, ma_type in _get_db_types_to_mathesar_types_iterator():
        if db_type == db_type_to_find:
            return ma_type
