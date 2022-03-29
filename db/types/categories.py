from db.types.base import PostgresType, MathesarCustomType, DatabaseType


STRING_LIKE_TYPES: frozenset[DatabaseType] = frozenset((
    PostgresType.CHAR,
    PostgresType.CHARACTER,
    PostgresType.CHARACTER_VARYING,
    PostgresType.NAME,
    PostgresType.TEXT,
    MathesarCustomType.URI,
    MathesarCustomType.EMAIL,
))

INTEGER_TYPES = frozenset((
    PostgresType.BIGINT,
    PostgresType.INTEGER,
    PostgresType.SMALLINT,
))

DECIMAL_TYPES = frozenset((
    PostgresType.DOUBLE_PRECISION,
    PostgresType.FLOAT,
    PostgresType.NUMERIC,
    PostgresType.REAL,
))

TIME_OF_DAY_TYPES: frozenset[DatabaseType] = frozenset((
    PostgresType.TIME,
    PostgresType.TIME_WITH_TIME_ZONE,
    PostgresType.TIME_WITHOUT_TIME_ZONE,
))

DATE_TYPES: frozenset[DatabaseType] = frozenset((
    PostgresType.DATE,
))

DATETIME_TYPES: frozenset[DatabaseType] = frozenset((
    PostgresType.TIMESTAMP,
    PostgresType.TIMESTAMP_WITH_TIME_ZONE,
    PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
))

POINT_IN_TIME_TYPES: frozenset[DatabaseType] = frozenset((
    *TIME_OF_DAY_TYPES,
    *DATETIME_TYPES,
    *DATE_TYPES,
))

DURATION_TYPES: frozenset[DatabaseType] = frozenset((
    PostgresType.INTERVAL,
))

TIME_RELATED_TYPES: frozenset[DatabaseType] = frozenset((
    *POINT_IN_TIME_TYPES,
    *DURATION_TYPES,
))

MONEY_TYPES: frozenset[DatabaseType] = frozenset((
    PostgresType.MONEY,
    MathesarCustomType.MATHESAR_MONEY,
))

NUMERIC_TYPES: frozenset[DatabaseType] = frozenset((
    *INTEGER_TYPES,
    *DECIMAL_TYPES,
))

# Comparable types are those that should support greater, lesser, equal comparisons amongst
# members of the same type (at least).
COMPARABLE_TYPES: frozenset[DatabaseType] = frozenset((
    *NUMERIC_TYPES,
    *MONEY_TYPES,
    *TIME_RELATED_TYPES,
))
