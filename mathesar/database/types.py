"""
This file maps "friendly" Mathesar data types to Postgres database types.
Mathesar data types are shown in the UI.
"""

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


MATHESAR_TYPES = [{
    'identifier': BOOLEAN,
    'name': 'Boolean',
    'db_types': ['BOOLEAN']
}, {
    'identifier': DATETIME,
    'name': 'Date & Time',
    'db_types': ['TIMESTAMP', 'DATE', 'TIME']
}, {
    'identifier': DURATION,
    'name': 'Duration',
    'db_types': ['INTERVAL']
}, {
    'identifier': EMAIL,
    'name': 'Email',
    'db_types': ['mathesar_types.email']
}, {
    'identifier': MONEY,
    'name': 'Money',
    'db_types': ['MONEY', 'mathesar_types.money']
}, {
    'identifier': NUMBER,
    'name': 'Number',
    'db_types': [
        'BIGINT',
        'DECIMAL',
        'DOUBLE PRECISION',
        'FLOAT',
        'INTEGER',
        'NUMERIC',
        'REAL',
        'SMALLINT',
        'mathesar_types.percentage'
    ]
}, {
    'identifier': TEXT,
    'name': 'Text',
    'db_types': ['VARCHAR', 'CHAR', 'TEXT']
}, {
    'identifier': URI,
    'name': 'URL',
    'db_types': ['mathesar_types.uri']
}, {
    'identifier': OTHER,
    'name': 'Other',
    'db_types': [
        'BIGSERIAL',
        'BIT VARYING',
        'BIT',
        'BOX',
        'BYTEA',
        'CIDR',
        'CIRCLE',
        'DATERANGE',
        'INET',
        'INT4RANGE',
        'INT8RANGE',
        'JSON',
        'JSONB',
        'LINE',
        'LSEG',
        'MACADDR',
        'MACADDR8',
        'NUMRANGE',
        'PATH',
        'POLYGON',
        'PG_LSN',
        'PG_SNAPSHOT',
        'POINT',
        'SERIAL',
        'SMALLSERIAL',
        'TSQUERY',
        'TSRANGE',
        'TSTZRANGE',
        'TSVECTOR',
        'TXID_SNAPSHOT',
        'XML'
    ]
}]
