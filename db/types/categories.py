from db.types.base import PostgresType, MathesarCustomType

STRING_TYPES = frozenset({
    PostgresType.CHARACTER,
    PostgresType.CHARACTER_VARYING,
    PostgresType.TEXT,
})

STRING_LIKE_TYPES = frozenset({
    *STRING_TYPES,
    PostgresType.CHAR,
    PostgresType.NAME,
    MathesarCustomType.URI,
    MathesarCustomType.EMAIL,
})

INTEGER_TYPES = frozenset({
    PostgresType.BIGINT,
    PostgresType.INTEGER,
    PostgresType.SMALLINT,
})

DECIMAL_TYPES = frozenset({
    PostgresType.DOUBLE_PRECISION,
    PostgresType.REAL,
})

TIME_OF_DAY_TYPES = frozenset({
    PostgresType.TIME_WITH_TIME_ZONE,
    PostgresType.TIME_WITHOUT_TIME_ZONE,
})

DATE_TYPES = frozenset({
    PostgresType.DATE,
})

DATETIME_TYPES = frozenset({
    PostgresType.TIMESTAMP_WITH_TIME_ZONE,
    PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE,
})

POINT_IN_TIME_TYPES = frozenset({
    *TIME_OF_DAY_TYPES,
    *DATETIME_TYPES,
    *DATE_TYPES,
})

DURATION_TYPES = frozenset({
    PostgresType.INTERVAL,
})

TIME_RELATED_TYPES = frozenset({
    *POINT_IN_TIME_TYPES,
    *DURATION_TYPES,
})

MONEY_WITH_CURRENCY_TYPES = frozenset({
    MathesarCustomType.MULTICURRENCY_MONEY,
})

MONEY_WITHOUT_CURRENCY_TYPES = frozenset({
    PostgresType.MONEY,
    MathesarCustomType.MATHESAR_MONEY,
})

MONEY_TYPES = frozenset({
    *MONEY_WITH_CURRENCY_TYPES,
    *MONEY_WITHOUT_CURRENCY_TYPES,
})

NUMERIC_TYPES = frozenset({
    *INTEGER_TYPES,
    *DECIMAL_TYPES,
    PostgresType.NUMERIC
})

# Comparable types are those that should support greater, lesser, equal comparisons amongst
# members of the same type (at least).
COMPARABLE_TYPES = frozenset({
    *NUMERIC_TYPES,
    *MONEY_TYPES,
    *TIME_RELATED_TYPES,
})
