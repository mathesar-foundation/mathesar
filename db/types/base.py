from enum import Enum

from sqlalchemy import create_engine

from db import constants

from db.functions import hints

from frozendict import frozendict


CHAR = 'char'
STRING = 'string'
VARCHAR = 'varchar'


class PostgresType(Enum):
    """
    This only includes built-in Postgres types that SQLAlchemy supports.
    SQLAlchemy doesn't support XML. See zzzeek's comment on:
    https://stackoverflow.com/questions/16153512/using-postgresql-xml-data-type-with-sqlalchemy
    The values are keys returned by get_available_types.
    """
    _ARRAY = '_array'
    BIGINT = 'bigint'
    BIT_VARYING = 'bit varying'
    BIT = 'bit'
    BOOLEAN = 'boolean'
    BYTEA = 'bytea'
    CHAR = '"char"'
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
    TIME_WITH_TIME_ZONE = 'time with time zone'
    TIME_WITHOUT_TIME_ZONE = 'time without time zone'
    TIMESTAMP = 'timestamp'
    TIMESTAMP_WITH_TIMESTAMP_ZONE = 'timestamp with time zone'
    TIMESTAMP_WITHOUT_TIMESTAMP_ZONE = 'timestamp without time zone'
    TSRANGE = 'tsrange'
    TSTZRANGE = 'tstzrange'
    TSVECTOR = 'tsvector'
    UUID = 'uuid'


class MathesarCustomType(Enum):
    """
    This is a list of custom Mathesar DB types.
    Keys returned by get_available_types are of the format 'mathesar_types.VALUE'
    """
    EMAIL = 'email'
    URI = 'uri'
    MONEY = 'money'


db_types_hinted = frozendict({
    PostgresType.BOOLEAN: tuple([
        hints.boolean
    ]),
    PostgresType.CHARACTER_VARYING: tuple([
        hints.string_like
    ]),
    PostgresType.CHARACTER: tuple([
        hints.string_like
    ]),
    PostgresType.NUMERIC: tuple([
        hints.comparable
    ]),
    PostgresType.TEXT: tuple([
        hints.string_like
    ]),
    MathesarCustomType.URI: tuple([
        hints.uri
    ]),
})


SCHEMA = f"{constants.MATHESAR_PREFIX}types"
# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
preparer = create_engine("postgresql://").dialect.identifier_preparer


def get_qualified_name(name):
    return ".".join([preparer.quote_schema(SCHEMA), name])


def get_available_types(engine):
    return engine.dialect.ischema_names


def get_db_type_name(sa_type, engine):
    USER_DEFINED_STR = 'user_defined'
    db_type = sa_type.__visit_name__
    if db_type == USER_DEFINED_STR:
        db_type = sa_type().compile(engine.dialect)
    return db_type
