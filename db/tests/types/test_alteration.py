from datetime import timedelta
from decimal import Decimal
from psycopg2.errors import InvalidParameterValue
import pytest
from sqlalchemy import Table, Column, MetaData
from sqlalchemy import String, Numeric
from sqlalchemy.exc import DataError
from db import types
from db.tests.types import fixtures
from db.types import alteration


# We need to set these variables when the file loads, or pytest can't
# properly detect the fixtures.  Importing them directly results in a
# flake8 unused import error, and a bunch of flake8 F811 errors.
engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


BOOLEAN = "BOOLEAN"
DECIMAL = "DECIMAL"
DOUBLE = "DOUBLE PRECISION"
EMAIL = "mathesar_types.email"
FLOAT = "FLOAT"
INTERVAL = "INTERVAL"
NUMERIC = "NUMERIC"
REAL = "REAL"
VARCHAR = "VARCHAR"


ISCHEMA_NAME = "ischema_name"
TARGET_LIST = "target_list"
REFLECTED_NAME = "reflected_name"
SUPPORTED_MAP_NAME = "supported_map_name"

MASTER_DB_TYPE_MAP_SPEC = {
    # This dict specifies the full map of what types can be cast to what
    # target types in Mathesar.  Format of each key, val pair is:
    # <db_set_type_name>: {
    #     ISCHEMA_NAME: <name for looking up in engine.dialect.ischema_names>,
    #     REFLECTED_NAME: <name for reflection of db type>,
    #     SUPPORTED_MAP_NAME: <optional; key in supported type map dictionaries>
    #     TARGET_LIST: <list of target db types for alteration>,
    # }
    # The tuples in TARGET_LIST should be (set, reflect), where 'set' is
    # a valid DB type for setting a column type, and 'reflect' is the
    # type actually reflected afterwards
    BOOLEAN: {
        ISCHEMA_NAME: "boolean",
        REFLECTED_NAME: BOOLEAN,
        TARGET_LIST: [BOOLEAN, DECIMAL, DOUBLE, FLOAT, NUMERIC, REAL, VARCHAR]
    },
    DECIMAL: {
        ISCHEMA_NAME: "decimal",
        REFLECTED_NAME: NUMERIC,
        TARGET_LIST: [BOOLEAN, DECIMAL, DOUBLE, FLOAT, NUMERIC, REAL, VARCHAR]
    },
    DOUBLE: {
        ISCHEMA_NAME: "double precision",
        REFLECTED_NAME: DOUBLE,
        TARGET_LIST: [BOOLEAN, DECIMAL, DOUBLE, FLOAT, NUMERIC, REAL, VARCHAR]
    },
    FLOAT: {
        ISCHEMA_NAME: "float",
        REFLECTED_NAME: DOUBLE,
        TARGET_LIST: [BOOLEAN, DECIMAL, DOUBLE, FLOAT, NUMERIC, REAL, VARCHAR]
    },
    INTERVAL: {
        ISCHEMA_NAME: "interval",
        REFLECTED_NAME: INTERVAL,
        TARGET_LIST: [INTERVAL, VARCHAR]
    },
    EMAIL: {
        ISCHEMA_NAME: "mathesar_types.email",
        SUPPORTED_MAP_NAME: "email",
        REFLECTED_NAME: EMAIL,
        TARGET_LIST: [EMAIL, VARCHAR]
    },
    NUMERIC: {
        ISCHEMA_NAME: "numeric",
        REFLECTED_NAME: NUMERIC,
        TARGET_LIST: [BOOLEAN, DECIMAL, DOUBLE, FLOAT, NUMERIC, REAL, VARCHAR]
    },
    REAL: {
        ISCHEMA_NAME: "real",
        REFLECTED_NAME: REAL,
        TARGET_LIST: [BOOLEAN, DECIMAL, DOUBLE, FLOAT, NUMERIC, REAL, VARCHAR]
    },
    VARCHAR: {
        ISCHEMA_NAME: "character varying",
        SUPPORTED_MAP_NAME: "varchar",
        REFLECTED_NAME: VARCHAR,
        TARGET_LIST: [
            BOOLEAN, DECIMAL, DOUBLE, EMAIL, FLOAT, INTERVAL, NUMERIC, REAL,
            VARCHAR,
        ]
    }
}


def test_get_alter_column_types_with_custom_engine(engine_with_types):
    type_dict = alteration.get_supported_alter_column_types(engine_with_types)
    assert all(
        [
            type_ in type_dict.values()
            for type_ in types.CUSTOM_TYPE_DICT.values()
        ]
    )


def test_get_alter_column_types_with_unfriendly_names(engine_with_types):
    type_dict = alteration.get_supported_alter_column_types(
        engine_with_types, friendly_names=False
    )
    assert all(
        [
            type_dict[type_]().compile(dialect=engine_with_types.dialect) == type_
            for type_ in type_dict
        ]
    )


type_test_list = [
    (
        val[ISCHEMA_NAME],
        MASTER_DB_TYPE_MAP_SPEC[target].get(
            SUPPORTED_MAP_NAME, MASTER_DB_TYPE_MAP_SPEC[target][ISCHEMA_NAME]
        ),
        {},
        MASTER_DB_TYPE_MAP_SPEC[target][REFLECTED_NAME]
    )
    for val in MASTER_DB_TYPE_MAP_SPEC.values()
    for target in val[TARGET_LIST]
] + [
    (val[ISCHEMA_NAME], "numeric", {"precision": 5}, "NUMERIC(5, 0)")
    for val in MASTER_DB_TYPE_MAP_SPEC.values() if NUMERIC in val[TARGET_LIST]
] + [
    (val[ISCHEMA_NAME], "numeric", {"precision": 5, "scale": 3}, "NUMERIC(5, 3)")
    for val in MASTER_DB_TYPE_MAP_SPEC.values() if NUMERIC in val[TARGET_LIST]
] + [
    (val[ISCHEMA_NAME], "decimal", {"precision": 5}, "NUMERIC(5, 0)")
    for val in MASTER_DB_TYPE_MAP_SPEC.values() if DECIMAL in val[TARGET_LIST]
] + [
    (val[ISCHEMA_NAME], "decimal", {"precision": 5, "scale": 3}, "NUMERIC(5, 3)")
    for val in MASTER_DB_TYPE_MAP_SPEC.values() if DECIMAL in val[TARGET_LIST]
]


@pytest.mark.parametrize(
    "type_,target_type,options,expect_type", type_test_list
)
def test_alter_column_type_alters_column_type(
        engine_email_type, type_, target_type, options, expect_type
):
    """
    The massive number of cases make sure all type casting functions at
    least pass a smoke test for each type mapping defined in
    MASTER_DB_TYPE_MAP_SPEC above.
    """
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, engine.dialect.ischema_names[type_]),
        schema=schema
    )
    input_table.create()
    alteration.alter_column_type(
        schema, TABLE_NAME, COLUMN_NAME, target_type, engine, type_options=options
    )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_column = Table(
        TABLE_NAME,
        metadata,
        schema=schema,
        autoload_with=engine
    ).columns[COLUMN_NAME]
    actual_type = actual_column.type.compile(dialect=engine.dialect)
    assert actual_type == expect_type


type_test_data_list = [
    (String, "boolean", {}, "false", False),
    (String, "boolean", {}, "true", True),
    (String, "boolean", {}, "f", False),
    (String, "boolean", {}, "t", True),
    (String, "interval", {}, "1 day", timedelta(days=1)),
    (String, "interval", {}, "1 week", timedelta(days=7)),
    (String, "interval", {}, "3:30", timedelta(hours=3, minutes=30)),
    (String, "interval", {}, "00:03:30", timedelta(minutes=3, seconds=30)),
    (String, "numeric", {}, "1", 1.0),
    (String, "numeric", {}, "1.2", Decimal('1.2')),
    (Numeric, "numeric", {}, 1, 1.0),
    (String, "numeric", {}, "5", 5),
    (String, "numeric", {}, "500000", 500000),
    (String, "numeric", {}, "500000.134", Decimal("500000.134")),
    (Numeric, "string", {}, 3, "3"),
    (String, "string", {}, "abc", "abc"),
    (String, "email", {}, "alice@example.com", "alice@example.com"),
    (Numeric(precision=5), "numeric", {}, 1, 1.0),
    (Numeric(precision=5, scale=2), "numeric", {}, 1, 1.0),
    (Numeric, "numeric", {"precision": 5, "scale": 2}, 1.234, Decimal("1.23")),
    # test that rounding is as intended
    (Numeric, "numeric", {"precision": 5, "scale": 2}, 1.235, Decimal("1.24")),
    (String, "numeric", {"precision": 5, "scale": 2}, "500.134", Decimal("500.13")),
]


@pytest.mark.parametrize(
    "type_,target_type,options,value,expect_value", type_test_data_list
)
def test_alter_column_type_casts_column_data(
        engine_email_type, type_, target_type, options, value, expect_value,
):
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, type_),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(value,))
    with engine.begin() as conn:
        conn.execute(ins)
    alteration.alter_column_type(
        schema, TABLE_NAME, COLUMN_NAME, target_type, engine, type_options=options
    )
    metadata = MetaData(bind=engine)
    metadata.reflect()
    actual_table = Table(
        TABLE_NAME,
        metadata,
        schema=schema,
        autoload_with=engine
    )
    sel = actual_table.select()
    with engine.connect() as conn:
        res = conn.execute(sel).fetchall()
    actual_value = res[0][0]
    assert actual_value == expect_value


type_test_bad_data_list = [
    (String, "boolean", "cat"),
    (String, "interval", "1 potato"),
    (String, "interval", "3"),
    (String, "numeric", "abc"),
    (String, "email", "alice-example.com"),
]


@pytest.mark.parametrize(
    "type_,target_type,value", type_test_bad_data_list
)
def test_alter_column_type_raises_on_bad_column_data(
        engine_email_type, type_, target_type, value,
):
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, type_),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(value,))
    with engine.begin() as conn:
        conn.execute(ins)
    with pytest.raises(Exception):
        alteration.alter_column_type(
            schema, TABLE_NAME, COLUMN_NAME, target_type, engine,
        )


def test_alter_column_type_raises_on_bad_parameters(
        engine_email_type,
):
    engine, schema = engine_email_type
    TABLE_NAME = "testtable"
    COLUMN_NAME = "testcol"
    metadata = MetaData(bind=engine)
    input_table = Table(
        TABLE_NAME,
        metadata,
        Column(COLUMN_NAME, Numeric),
        schema=schema
    )
    input_table.create()
    ins = input_table.insert(values=(5.3,))
    with engine.begin() as conn:
        conn.execute(ins)
    bad_options = {"precision": 3, "scale": 4}  # scale must be smaller than precision
    with pytest.raises(DataError) as e:
        alteration.alter_column_type(
            schema, TABLE_NAME, COLUMN_NAME, "numeric", engine, type_options=bad_options
        )
        assert e.orig == InvalidParameterValue


def test_get_column_cast_expression_unchanged(engine_with_types):
    target_type = "numeric"
    col_name = "my_column"
    column = Column(col_name, Numeric)
    cast_expr = alteration.get_column_cast_expression(
        column, target_type, engine_with_types
    )
    assert cast_expr == column


def test_get_column_cast_expression_change(engine_with_types):
    target_type = "boolean"
    col_name = "my_column"
    column = Column(col_name, Numeric)
    cast_expr = alteration.get_column_cast_expression(
        column, target_type, engine_with_types
    )
    assert str(cast_expr) == f"mathesar_types.cast_to_boolean({col_name})"


def test_get_column_cast_expression_change_quotes(engine_with_types):
    target_type = "boolean"
    col_name = "A Column Needing Quotes"
    column = Column(col_name, Numeric)
    cast_expr = alteration.get_column_cast_expression(
        column, target_type, engine_with_types
    )
    assert str(cast_expr) == f'mathesar_types.cast_to_boolean("{col_name}")'


def test_get_column_cast_expression_unsupported(engine_with_types):
    target_type = "this_type_does_not_exist"
    column = Column("colname", Numeric)
    with pytest.raises(alteration.UnsupportedTypeException):
        alteration.get_column_cast_expression(
            column, target_type, engine_with_types
        )


cast_expr_numeric_option_list = [
    (Numeric, {"precision": 3}, 'CAST(colname AS NUMERIC(3))'),
    (Numeric, {"precision": 3, "scale": 2}, 'CAST(colname AS NUMERIC(3, 2))'),
    (Numeric, {"precision": 3, "scale": 2}, 'CAST(colname AS NUMERIC(3, 2))'),
    (
        String,
        {"precision": 3, "scale": 2},
        'CAST(mathesar_types.cast_to_numeric(colname) AS NUMERIC(3, 2))'
    )
]


@pytest.mark.parametrize("type_,options,expect_cast_expr", cast_expr_numeric_option_list)
def test_get_column_cast_expression_numeric_options(
        engine_with_types, type_, options, expect_cast_expr
):
    target_type = "numeric"
    column = Column("colname", type_)
    cast_expr = alteration.get_column_cast_expression(
        column, target_type, engine_with_types, type_options=options,
    )
    assert str(cast_expr) == expect_cast_expr


expect_cast_tuples = [
    (key, [target for target in val[TARGET_LIST]])
    for key, val in MASTER_DB_TYPE_MAP_SPEC.items()
]


@pytest.mark.parametrize("source_type,expect_target_types", expect_cast_tuples)
def test_get_full_cast_map(engine_with_types, source_type, expect_target_types):
    actual_cast_map = alteration.get_full_cast_map(engine_with_types)
    actual_target_types = actual_cast_map[source_type]
    assert len(actual_target_types) == len(expect_target_types)
    assert sorted(actual_target_types) == sorted(expect_target_types)
