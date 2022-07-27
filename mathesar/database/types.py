"""
This file describes UI data types and how they map to DB-layer database types (subclasses
of db.types.base.DatabaseType).
"""
from enum import Enum
from collections.abc import Collection
from db.types.base import (
    DatabaseType, PostgresType, MathesarCustomType
)
from db.types.hintsets import db_types_hinted


class UIType(Enum):
    id: str  # noqa: NT001
    display_name: str  # noqa: NT001
    db_types: Collection[DatabaseType]  # noqa: NT001

    BOOLEAN = (
        'boolean',
        'Boolean',
        {
            PostgresType.BOOLEAN,
        },
    )
    DATE = (
        'date',
        'Date',
        {
            PostgresType.DATE,
        },
    )
    TIME = (
        'time',
        'Time',
        {
            PostgresType.TIME_WITH_TIME_ZONE,
            PostgresType.TIME_WITHOUT_TIME_ZONE,
        },
    )
    DATETIME = (
        'datetime',
        'Date & Time',
        {
            PostgresType.TIMESTAMP_WITH_TIME_ZONE,
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
        },
    )
    DURATION = (
        'duration',
        'Duration',
        {
            PostgresType.INTERVAL,
        },
    )
    EMAIL = (
        'email',
        'Email',
        {
            MathesarCustomType.EMAIL,
        },
    )
    MONEY = (
        'money',
        'Money',
        {
            PostgresType.MONEY,
            MathesarCustomType.MATHESAR_MONEY,
            MathesarCustomType.MULTICURRENCY_MONEY,
        }
    )
    NUMBER = (
        'number',
        'Number',
        {
            PostgresType.BIGINT,
            PostgresType.DOUBLE_PRECISION,
            PostgresType.INTEGER,
            PostgresType.NUMERIC,
            PostgresType.REAL,
            PostgresType.SMALLINT,
        }
    )
    TEXT = (
        'text',
        'Text',
        {
            PostgresType.CHARACTER,
            PostgresType.CHARACTER_VARYING,
            PostgresType.TEXT,
            PostgresType.NAME,
            PostgresType.CHAR,
        },
    )
    URI = (
        'uri',
        'URI',
        {
            MathesarCustomType.URI,
        }
    )
    JSON_ARRAY = (
        'jsonlist',
        'JSON List',
        {
            MathesarCustomType.MATHESAR_JSON_ARRAY,
        }
    )
    JSON_OBJECT = (
        'map',
        'Map',
        {
            MathesarCustomType.MATHESAR_JSON_OBJECT,
        }
    )
    # These are default Postgres types that we don't have specific behavior for yet in the UI.
    OTHER = (
        'other',
        'Other',
        {
            PostgresType._ARRAY,
            PostgresType.BIT_VARYING,
            PostgresType.BIT,
            PostgresType.BYTEA,
            PostgresType.CIDR,
            PostgresType.DATERANGE,
            PostgresType.HSTORE,
            PostgresType.INET,
            PostgresType.INT4RANGE,
            PostgresType.INT8RANGE,
            PostgresType.JSON,
            PostgresType.JSONB,
            PostgresType.MACADDR,
            PostgresType.NUMRANGE,
            PostgresType.OID,
            PostgresType.REGCLASS,
            PostgresType.TSRANGE,
            PostgresType.TSTZRANGE,
            PostgresType.TSVECTOR,
            PostgresType.UUID,
        },
    )

    def __new__(cls, ui_type_id, display_name, db_types):
        """
        The Enum is adapted to take three initial properties. Enum's value is set to be the first
        property -- the id.
        """
        obj = object.__new__(cls)
        obj._value_ = ui_type_id
        obj.id = ui_type_id
        obj.display_name = display_name
        obj.db_types = frozenset(db_types)
        return obj

    def __str__(self):
        return self.id


def ui_types_that_satisfy_hintset(ui_types_mapped_to_hintsets, hintset):
    """
    Provided a mapping of UI types to their hintsets and a hintset, tries to find UI
    types whose hintsets satisfy the passed hintset, meaning the UI types whose hintsets are
    supersets of the passed hintset.
    """
    hintset = set(hintset)
    return frozenset(
        ui_type
        for ui_type, ui_type_hintset
        in ui_types_mapped_to_hintsets.items()
        if set.issubset(hintset, ui_type_hintset)
    )


def get_ui_types_mapped_to_hintsets():
    """
    Returns a dict where the keys are UI types and the values their hintsets.
    A UI type's hintset is defined as the intersection of the hintsets of its associated
    database types.
    """
    ui_types_mapped_to_hintsets = {}
    for ui_type in UIType:
        associated_db_types = ui_type.db_types
        associated_db_type_hintsets = tuple(
            set(db_types_hinted[associated_db_type])
            for associated_db_type in associated_db_types
            if associated_db_type in db_types_hinted
        )
        hintsets_intersection = _safe_set_intersection(associated_db_type_hintsets)
        ui_types_mapped_to_hintsets[ui_type] = frozenset(hintsets_intersection)
    return ui_types_mapped_to_hintsets


def _safe_set_intersection(sets):
    # set.intersection fails if it is not passed anything.
    if len(sets) > 0:
        return set.intersection(*sets)
    else:
        return set()


def get_ui_type_from_db_type(db_type_to_find):
    for ui_type in UIType:
        associated_db_types = ui_type.db_types
        if db_type_to_find in associated_db_types:
            return ui_type


def get_ui_type_from_id(ui_type_id):
    try:
        return UIType(ui_type_id)
    except ValueError:
        return None
