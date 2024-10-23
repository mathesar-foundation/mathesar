"""
This file describes UI data types and how they map to DB-layer database types (subclasses
of db.deprecated.types.base.DatabaseType).
"""
from enum import Enum
from db.deprecated.types.base import (
    PostgresType, MathesarCustomType
)


class UIType(Enum):

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
    ARRAY = (
        'array',
        'Array',
        {
            PostgresType._ARRAY,
        }
    )
    # These are default Postgres types that we don't have specific behavior for yet in the UI.
    OTHER = (
        'other',
        'Other',
        {
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


def get_ui_type_from_db_type(db_type_to_find):
    for ui_type in UIType:
        associated_db_types = ui_type.db_types
        if db_type_to_find in associated_db_types:
            return ui_type
