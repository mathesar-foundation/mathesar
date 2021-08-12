"""
This file maps "friendly" Mathesar data types to Postgres database types.
Mathesar data types are shown in the UI.
"""

from db.types.base import PostgresType


MATHESAR_BOOLEAN = 'boolean'
MATHESAR_DATETIME = 'datetime'
MATHESAR_DURATION = 'duration'
MATHESAR_EMAIL = 'email'
MATHESAR_MONEY = 'money'
MATHESAR_NUMBER = 'number'
MATHESAR_TEXT = 'text'
MATHESAR_URI = 'uri'

# These are default Postgres types that we don't have specific behavior for yet in the UI.
MATHESAR_OTHER = 'other'

# These are types that we don't know anything about.
MATHESAR_CUSTOM = 'custom'


MATHESAR_TYPES = [{
    'identifier': MATHESAR_BOOLEAN,
    'name': 'Boolean',
    'pg_types': [PostgresType.BOOLEAN.value]
}, {
    'identifier': MATHESAR_DATETIME,
    'name': 'Date & Time',
    'pg_types': [
        PostgresType.DATE.value,
        PostgresType.TIME_WITH_TIME_ZONE.value,
        PostgresType.TIME_WITHOUT_TIME_ZONE.value,
        PostgresType.TIMESTAMP.value,
        PostgresType.TIMESTAMP_WITH_TIMESTAMP_ZONE.value,
        PostgresType.TIMESTAMP_WITHOUT_TIMESTAMP_ZONE.value
    ]
}, {
    'identifier': MATHESAR_DURATION,
    'name': 'Duration',
    'pg_types': [PostgresType.INTERVAL.value]
}, {
    'identifier': MATHESAR_EMAIL,
    'name': 'Email',
    'pg_types': ['mathesar_types.email']
}, {
    'identifier': MATHESAR_MONEY,
    'name': 'Money',
    'pg_types': [PostgresType.MONEY.value, 'mathesar_types.money']
}, {
    'identifier': MATHESAR_NUMBER,
    'name': 'Number',
    'pg_types': [
        PostgresType.BIGINT.value,
        PostgresType.DECIMAL.value,
        PostgresType.DOUBLE_PRECISION.value,
        PostgresType.FLOAT.value,
        PostgresType.INTEGER.value,
        PostgresType.NUMERIC.value,
        PostgresType.REAL.value,
        PostgresType.SMALLINT.value,
        'mathesar_types.percentage'
    ]
}, {
    'identifier': MATHESAR_TEXT,
    'name': 'Text',
    'pg_types': [
        PostgresType.CHARACTER.value,
        PostgresType.CHARACTER_VARYING.value,
        PostgresType.TEXT.value,
    ]
}, {
    'identifier': MATHESAR_URI,
    'name': 'URL',
    'pg_types': ['mathesar_types.uri']
}]
