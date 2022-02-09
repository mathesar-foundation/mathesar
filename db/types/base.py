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
    TIMESTAMP_WITH_TIME_ZONE = 'timestamp with time zone'
    TIMESTAMP_WITHOUT_TIME_ZONE = 'timestamp without time zone'
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


def get_db_type_enum_from_id(db_type_id):
    """
    Gets an instance of either the PostgresType enum or the MathesarCustomType enum corresponding
    to the provided db_type_id. If the id doesn't correspond to any of the mentioned enums,
    returns None.
    """
    try:
        return PostgresType(db_type_id)
    except ValueError:
        try:
            return MathesarCustomType(db_type_id)
        except ValueError:
            return None


def _build_db_types_hinted():
    db_types_hinted = {
        PostgresType.BOOLEAN: tuple([
            hints.boolean
        ]),
        PostgresType.CHARACTER_VARYING: tuple([
            hints.string_like
        ]),
        PostgresType.CHARACTER: tuple([
            hints.string_like
        ]),
        PostgresType.TEXT: tuple([
            hints.string_like
        ]),
        MathesarCustomType.URI: tuple([
            hints.uri
        ]),
    }

    # mutates db_types_hinted
    def _add_to_db_type_hintsets(db_types, hints):
        for db_type in db_types:
            if db_type in db_types_hinted:
                updated_hintset = tuple(set(db_types_hinted[db_type] + tuple(hints)))
                db_types_hinted[db_type] = updated_hintset
            else:
                db_types_hinted[db_type] = tuple(hints)

    numeric_db_types = (
        PostgresType.BIGINT,
        PostgresType.DECIMAL,
        PostgresType.DOUBLE_PRECISION,
        PostgresType.FLOAT,
        PostgresType.INTEGER,
        PostgresType.SMALLINT,
        PostgresType.NUMERIC,
        PostgresType.REAL,
    )

    hints_for_numeric_db_types = (hints.comparable,)

    _add_to_db_type_hintsets(numeric_db_types, hints_for_numeric_db_types)

    return frozendict(db_types_hinted)


db_types_hinted = _build_db_types_hinted()


SCHEMA = f"{constants.MATHESAR_PREFIX}types"
# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
preparer = create_engine("postgresql://").dialect.identifier_preparer


def get_qualified_name(name):
    return ".".join([preparer.quote_schema(SCHEMA), name])


def get_available_types(engine):
    """
    Returns a dict where the keys are database type names defined on the database associated with
    provided Engine, and the values are their SQLAlchemy classes.
    """
    return engine.dialect.ischema_names


_known_vanilla_db_types = tuple(postgres_type for postgres_type in PostgresType)


_known_custom_db_types = tuple(mathesar_custom_type for mathesar_custom_type in MathesarCustomType)


# Known database types are those that are defined on our PostgresType and MathesarCustomType Enums.
known_db_types = _known_vanilla_db_types + _known_custom_db_types


def get_available_known_db_types(engine):
    """
    Returns database types that are both available on the database and known through our Enums
    above.
    """
    available_db_types = get_available_types(engine)
    return tuple(
        known_db_type
        for known_db_type in known_db_types
        if known_db_type.value in available_db_types
    )


def get_db_type_name(sa_type, engine):
    try:
        db_type = sa_type.compile(dialect=engine.dialect)
    except TypeError:
        db_type = sa_type().compile(dialect=engine.dialect)
    return db_type
