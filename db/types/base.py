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
    MATHESAR_MONEY = 'mathesar_money'
    MULTICURRENCY_MONEY = 'multicurrency_money'
    URI = 'uri'


_known_vanilla_db_types = tuple(postgres_type for postgres_type in PostgresType)


_known_custom_db_types = tuple(mathesar_custom_type for mathesar_custom_type in MathesarCustomType)


# Known database types are those that are defined on our PostgresType and MathesarCustomType Enums.
known_db_types = _known_vanilla_db_types + _known_custom_db_types


# Origin: https://www.python.org/dev/peps/pep-0616/#id17
def _remove_prefix(self: str, prefix: str, /) -> str:
    """
    This will remove the passed prefix, if it's there.
    Otherwise, it will return the string unchanged.
    """
    if self.startswith(prefix):
        return self[len(prefix):]
    else:
        return self[:]


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
            # Sometimes MA type identifiers are qualified like so: `mathesar_types.uri`.
            # We want to remove that prefix, when it's there, because MathesarCustomType
            # enum stores type ids without a qualifier (e.g. `uri`).
            possible_prefix = _ma_type_qualifier_prefix + '.'
            preprocessed_db_type_id = _remove_prefix(db_type_id, possible_prefix)
            return MathesarCustomType(preprocessed_db_type_id)
        except ValueError:
            return None


def _build_db_types_hinted():
    """
    Builds up a map of db types to hintsets.
    """
    # Start out by defining some hints manually.
    db_types_hinted = {
        PostgresType.BOOLEAN: tuple([
            hints.boolean
        ]),
        MathesarCustomType.URI: tuple([
            hints.uri
        ]),
        MathesarCustomType.EMAIL: tuple([
            hints.email
        ]),
    }

    # Then, start adding hints automatically.
    # This is for many-to-many relationships, i.e. adding multiple identical hintsets to the
    # hintsets of multiple db types.
    def _add_to_db_type_hintsets(db_types, hints):
        """
        Mutates db_types_hinted to map every hint in `hints` to every DB type in `db_types`.
        """
        for db_type in db_types:
            if db_type in db_types_hinted:
                updated_hintset = tuple(set(db_types_hinted[db_type] + tuple(hints)))
                db_types_hinted[db_type] = updated_hintset
            else:
                db_types_hinted[db_type] = tuple(hints)

    # all types get the "any" hint
    all_db_types = known_db_types
    hints_for_all_db_types = (hints.any,)
    _add_to_db_type_hintsets(all_db_types, hints_for_all_db_types)

    # string-like types get the "string_like" hint
    string_like_db_types = (
        PostgresType.CHAR,
        PostgresType.CHARACTER,
        PostgresType.CHARACTER_VARYING,
        PostgresType.NAME,
        PostgresType.TEXT,
        MathesarCustomType.URI,
        MathesarCustomType.EMAIL,
    )
    hints_for_string_like_types = (hints.string_like,)
    _add_to_db_type_hintsets(string_like_db_types, hints_for_string_like_types)

    # numeric types get the "comparable" hint
    numeric_db_types = (
        PostgresType.BIGINT,
        PostgresType.DECIMAL,
        PostgresType.DOUBLE_PRECISION,
        PostgresType.FLOAT,
        PostgresType.INTEGER,
        PostgresType.SMALLINT,
        PostgresType.NUMERIC,
        PostgresType.REAL,
        PostgresType.MONEY,
        MathesarCustomType.MATHESAR_MONEY,
    )
    hints_for_numeric_db_types = (hints.comparable,)
    _add_to_db_type_hintsets(numeric_db_types, hints_for_numeric_db_types)

    # time of day db types get the "time" hint
    time_of_day_db_types = (
        PostgresType.TIME,
        PostgresType.TIME_WITH_TIME_ZONE,
        PostgresType.TIME_WITHOUT_TIME_ZONE,
    )
    _add_to_db_type_hintsets(time_of_day_db_types, (hints.time,))

    # point in time db types get the "point_in_time" hint
    point_in_time_db_types = (
        *time_of_day_db_types,
        PostgresType.DATE,
    )
    hints_for_point_in_time_types = (hints.point_in_time,)
    _add_to_db_type_hintsets(point_in_time_db_types, hints_for_point_in_time_types)

    # date db types get the "date" hint
    date_db_types = (
        PostgresType.DATE,
    )
    _add_to_db_type_hintsets(date_db_types, (hints.date,))

    # datetime db types get the "date" and "time" hints
    datetime_db_types = (
        PostgresType.TIMESTAMP,
        PostgresType.TIMESTAMP_WITH_TIME_ZONE,
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
    )
    _add_to_db_type_hintsets(datetime_db_types, (hints.date, hints.time,))

    # duration db types get the "duration" hints
    duration_db_types = (
        PostgresType.INTERVAL,
    )
    _add_to_db_type_hintsets(duration_db_types, (hints.duration,))

    # time related types get the "comparable" hint
    time_related_db_types = (
        *point_in_time_db_types,
        *duration_db_types,
    )
    hints_for_time_related_types = (hints.comparable,)
    _add_to_db_type_hintsets(time_related_db_types, hints_for_time_related_types)

    return frozendict(db_types_hinted)


db_types_hinted = _build_db_types_hinted()


SCHEMA = f"{constants.MATHESAR_PREFIX}types"
# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
preparer = create_engine("postgresql://").dialect.identifier_preparer


# Should usually equal `mathesar_types`
_ma_type_qualifier_prefix = preparer.quote_schema(SCHEMA)


def get_qualified_name(name):
    return ".".join([_ma_type_qualifier_prefix, name])


def get_available_types(engine):
    """
    Returns a dict where the keys are database type names defined on the database associated with
    provided Engine, and the values are their SQLAlchemy classes.
    """
    return engine.dialect.ischema_names


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
