from enum import Enum

from sqlalchemy import text, create_engine as sa_create_engine

from db import constants
from db.utils import OrderByIds


class DatabaseType(OrderByIds):

    value: str  # noqa: NT001

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

    def is_available(self, engine, type_ids_on_database=None):
        """
        Returns true if this type is available on provided engine's database. For the sake of
        optimizing IO, the result of get_type_ids_on_database(engine) may be passed as the
        type_ids_on_database parameter.
        """
        if type_ids_on_database is None:
            type_ids_on_database = get_type_ids_on_database(engine)
        is_type_in_database = self.id in type_ids_on_database
        return is_type_in_database

    def get_sa_instance_compiled(self, engine, type_options=None):
        if type_options is None:
            type_options = {}
        sa_class = self.get_sa_class(engine)
        if sa_class:
            dialect = engine.dialect
            instance = sa_class(**type_options)
            return instance.compile(dialect=dialect)

    @property
    def is_sa_only(self):
        """
        A column can be reflected to have an SQLAlchemy type that does not represent an actual
        Postgres type.
        """
        return self in _sa_only_db_types

    @property
    def is_optional(self):
        """
        Some types are official, but optional in that they may or may not be installed on a given
        Postgres database.
        """
        return self in _optional_db_types

    @property
    def is_inconsistent(self):
        return self in _inconsistent_db_types

    @property
    def is_ignored(self):
        """
        We ignore some types. Current rule is that if type X is applied to a column, but upon
        reflection that column is of some other type, we ignore type X. This mostly means
        ignoring aliases. It also ignores NAME, because it's reflected as the SA
        String type.
        """
        return self in _inconsistent_db_types

    @property
    def is_reflection_supported(self):
        return not self.is_inconsistent

    @property
    def is_application_supported(self):
        return not self.is_inconsistent and not self.is_sa_only

    def __str__(self):
        return self.id


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


SCHEMA = f"{constants.MATHESAR_PREFIX}types"

# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
_preparer = sa_create_engine("postgresql://").dialect.identifier_preparer


def get_ma_qualified_schema():
    """
    Should usually return `mathesar_types`
    """
    return _preparer.quote_schema(SCHEMA)


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


_sa_only_db_types = frozenset({
    PostgresType._ARRAY,
})


_optional_db_types = frozenset({
    PostgresType.HSTORE,
})


_known_vanilla_db_types = frozenset(postgres_type for postgres_type in PostgresType)


_known_custom_db_types = frozenset(mathesar_custom_type for mathesar_custom_type in MathesarCustomType)


# Known database types are those that are defined on our PostgresType and MathesarCustomType Enums.
known_db_types = frozenset.union(_known_vanilla_db_types, _known_custom_db_types)


# TODO improve name; currently its weird names serves to distinguish it from similarly named
# methods throughout the codebase; should be renamed at earliest convenience.
def get_available_known_db_types(engine):
    """
    Returns a tuple of DatabaseType instances that are not ignored and are available on provided
    engine.
    """
    type_ids_on_database = get_type_ids_on_database(engine)
    return tuple(
        db_type
        for db_type in known_db_types
        if (
            not db_type.is_ignored
            and db_type.is_available(
                engine,
                type_ids_on_database=type_ids_on_database,
            )
        )
    )


def get_type_ids_on_database(engine):
    """
    Returns db type ids available on the database.
    """
    # Adapted from the SQL expression produced by typing `\dT *` in psql.
    select_statement = text(
        "SELECT\n"
        "  pg_catalog.format_type(t.oid, NULL) AS \"Name\"\n"
        " FROM pg_catalog.pg_type t\n"
        "      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace\n"
        " WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid))\n"
        "   AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid);"
    )
    with engine.connect() as connection:
        db_type_ids = frozenset(
            db_type_id
            for db_type_id,
            in connection.execute(select_statement)
        )
        return db_type_ids


class UnknownDbTypeId(Exception):
    pass
