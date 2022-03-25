from enum import Enum

from sqlalchemy import create_engine

from db import constants

from typing import Optional, Sequence


class DatabaseType:

    value: str

    @property
    def id(self) -> str:
        """
        Here we're defining Enum's value attribute to be the database type id.
        """
        return self.value

    def get_sa_class(self, engine):
        """
        Returns the SA class corresponding to this type or None if this type is not supported by
        provided engine, or if it's ignored (see is_ignored).
        """
        if not self.is_ignored:
            ischema_names = engine.dialect.ischema_names
            return ischema_names.get(self.id)

    def is_available(self, engine) -> bool:
        """
        Returns true if this type is available on provided engine.
        """
        return self.get_sa_class(engine) is not None

    @property
    def is_ignored(self) -> bool:
        """
        We ignore some types. Current rule is that if type X is applied to a column, but upon
        reflection that column is of some other type, we ignore type X. This mostly means
        ignoring aliases. It also ignores NAME and CHAR, because both are reflected as the SA
        String type.
        """
        # TODO should PostgresType.FLOAT be ignored as well? is it reflected as DOUBLE_PRECISION?
        ignored_types = (
            PostgresType.TIME,
            PostgresType.TIMESTAMP,
            PostgresType.DECIMAL,
            PostgresType.NAME,
            PostgresType.CHAR,
        )
        return self in ignored_types


class PostgresType(DatabaseType, Enum):
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


SCHEMA = f"{constants.MATHESAR_PREFIX}types"
# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
preparer = create_engine("postgresql://").dialect.identifier_preparer


# Should usually equal `mathesar_types`
_ma_type_qualifier_prefix = preparer.quote_schema(SCHEMA)


# TODO rename to get_qualified_mathesar_obj_name
# it's not only used for types. it's also used for qualifying sql function ids
def get_qualified_name(unqualified_name):
    return ".".join([_ma_type_qualifier_prefix, unqualified_name])


# TODO big misnomer!
# we already have a concept of Mathesar types (UI types) in the mathesar namespace.
# maybe rename to just CustomType?
# also, note that db layer should not be aware of Mathesar
class MathesarCustomType(DatabaseType, Enum):
    """
    This is a list of custom Mathesar DB types.
    Keys returned by get_available_types are of the format 'mathesar_types.VALUE'
    """
    EMAIL = 'email'
    MATHESAR_MONEY = 'mathesar_money'
    MULTICURRENCY_MONEY = 'multicurrency_money'
    URI = 'uri'

    def __new__(cls, unqualified_id):
        """
        Prefixes a qualifier to this Enum's values.
        `email` becomes something akin to `mathesar_types.email`.
        """
        qualified_id = get_qualified_name(unqualified_id)
        instance = object.__new__(cls)
        instance._value_ = qualified_id
        return instance


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


def get_db_type_enum_from_id(db_type_id) -> Optional[DatabaseType]:
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


# TODO improve name; currently its weird names serves to distinguish it from similarly named
# methods throughout the codebase; should be renamed at earliest convenience.
def get_available_known_db_types(engine) -> Sequence[DatabaseType]:
    """
    Returns a tuple of DatabaseType instances that are available on provided engine.
    """
    return tuple(
        db_type
        for db_type in known_db_types
        if db_type.is_available(engine)
    )


def get_db_type_enum_from_class(sa_type, engine) -> DatabaseType:
    try:
        db_type_id = sa_type.compile(dialect=engine.dialect)
    except TypeError:
        db_type_id = sa_type().compile(dialect=engine.dialect)
    db_type = get_db_type_enum_from_id(db_type_id)
    if db_type:
        return db_type
    else:
        raise Exception("We don't know how to map this type class to a DatabaseType Enum.")
