from enum import Enum

from sqlalchemy import create_engine

from db import constants


# This only includes built-in types that SQLAlchemy supports.
# SQLAlchemy doesn't support XML. See zzzeek's comment on:
# https://stackoverflow.com/questions/16153512/using-postgresql-xml-data-type-with-sqlalchemy
class PostgresType(Enum):
    _ARRAY = '_array'
    BIGINT = 'bigint'
    BIT_VARYING = 'bit varying'
    BIT = 'bit'
    BOOLEAN = 'boolean'
    BYTEA = 'bytea'
    CHARACTER_VARYING = 'character varying'
    CHARACTER = 'character'
    CIDR = 'cidr'
    DATE = 'date'
    DATERANGE = 'daterange'
    DECIMAL = 'decimal'
    DOUBLE_PRECISION = 'double precision'
    FLOAT = 'float'
    HSTORE = 'hstore'
    INET = 'inet'
    INT4RANGE = 'int4range'
    INT8RANGE = 'int8range'
    INTEGER = 'integer'
    INTERVAL = 'interval'
    JSON = 'json'
    JSONB = 'jsonb'
    MACADDR = 'macaddr'
    MONEY = 'money'
    NAME = 'name'
    NUMERIC = 'numeric'
    NUMRANGE = 'numrange'
    OID = 'oid'
    REAL = 'real'
    REGCLASS = 'regclass'
    SMALLINT = 'smallint'
    TEXT = 'text'
    TIME = 'time'
    TIME_WITH_TIME_ZONE = 'time without time zone'
    TIME_WITHOUT_TIME_ZONE = 'time without time zone'
    TIMESTAMP = 'timestamp'
    TIMESTAMP_WITH_TIMESTAMP_ZONE = 'timestamp without time zone'
    TIMESTAMP_WITHOUT_TIMESTAMP_ZONE = 'timestamp without time zone'
    TSRANGE = 'tsrange'
    TSTZRANGE = 'tstzrange'
    TSVECTOR = 'tsvector'
    UUID = 'uuid'


SCHEMA = f"{constants.MATHESAR_PREFIX}types"
# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
preparer = create_engine("postgresql://").dialect.identifier_preparer


def get_qualified_name(name):
    return ".".join([preparer.quote_schema(SCHEMA), name])


def get_installed_types(engine):
    return engine.dialect.ischema_names
