from enum import Enum

from sqlalchemy import create_engine as sa_create_engine

from db.constants import TYPES_SCHEMA


class DatabaseType:

    @property
    def id(self):
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

    @property
    def is_ignored(self):
        """
        We ignore some types. Current rule is that if type X is applied to a column, but upon
        reflection that column is of some other type, we ignore type X. This mostly means
        ignoring aliases. It also ignores NAME, because it's reflected as the SA
        String type.
        """
        return self in _inconsistent_db_types

    def __str__(self):
        return self.id


class UnknownType(DatabaseType):
    """
    Meant to represent types that are not enumerated by the other DatabaseType
    subclasses. Currently, we don't support knowing what an unknown type
    actually is (e.g. what it is called). Our representation of SA's NullType.
    """
    value = "__unknown__"


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
    DOUBLE_PRECISION = 'double precision'
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
    TIME_WITH_TIME_ZONE = 'time with time zone'
    TIME_WITHOUT_TIME_ZONE = 'time without time zone'
    TIMESTAMP_WITH_TIME_ZONE = 'timestamp with time zone'
    TIMESTAMP_WITHOUT_TIME_ZONE = 'timestamp without time zone'
    TSRANGE = 'tsrange'
    TSTZRANGE = 'tstzrange'
    TSVECTOR = 'tsvector'
    UUID = 'uuid'


# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
_preparer = sa_create_engine("postgresql://").dialect.identifier_preparer


def get_ma_qualified_schema():
    """
    Should usually return `mathesar_types`
    """
    return _preparer.quote_schema(TYPES_SCHEMA)


# TODO rename to get_qualified_mathesar_obj_name
# it's not only used for types. it's also used for qualifying sql function ids
def get_qualified_name(unqualified_name):
    qualifier_prefix = get_ma_qualified_schema()
    return ".".join([qualifier_prefix, unqualified_name])


# TODO big misnomer!
# we already have a concept of Mathesar types (UI types) in the mathesar namespace.
# maybe rename to just CustomType?
# also, note that db layer should not be aware of Mathesar
class MathesarCustomType(DatabaseType, Enum):
    """
    This is a list of custom Mathesar DB types.
    """
    EMAIL = 'email'
    MATHESAR_MONEY = 'mathesar_money'
    MULTICURRENCY_MONEY = 'multicurrency_money'
    URI = 'uri'
    MATHESAR_JSON_OBJECT = 'mathesar_json_object'
    MATHESAR_JSON_ARRAY = 'mathesar_json_array'

    def __new__(cls, unqualified_id):
        """
        Prefixes a qualifier to this Enum's values.
        `email` becomes something akin to `mathesar_types.email`.
        """
        qualified_id = get_qualified_name(unqualified_id)
        instance = object.__new__(cls)
        instance._value_ = qualified_id
        return instance


_inconsistent_db_types = frozenset.union(
    frozenset({
        PostgresType.NAME,
        PostgresType.BIT_VARYING,
    }),
)
