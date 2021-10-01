from alembic.migration import MigrationContext
from alembic.operations import Operations
import pytest
from sqlalchemy import (
    String, Integer, Column, Table, MetaData, Sequence, DateTime, func, text, DefaultClause
)

from db.columns.operations.select import (
    get_column_default, get_column_index_from_name, _is_default_expr_dynamic
)
from db.tables.operations.select import get_oid_from_table
from db.tests.columns.utils import column_test_dict, get_default


def test_get_column_index_from_name(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    zero_name = "colzero"
    one_name = "colone"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(zero_name, Integer),
        Column(one_name, String),
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    assert get_column_index_from_name(table_oid, zero_name, engine) == 0
    assert get_column_index_from_name(table_oid, one_name, engine) == 1


def test_get_column_index_from_name_after_delete(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    zero_name = "colzero"
    one_name = "colone"
    two_name = "coltwo"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(zero_name, Integer),
        Column(one_name, String),
        Column(two_name, String),
    )
    table.create()
    with engine.begin() as conn:
        op = Operations(MigrationContext.configure(conn))
        op.drop_column(table.name, one_name, schema=schema)

    table_oid = get_oid_from_table(table_name, schema, engine)
    assert get_column_index_from_name(table_oid, zero_name, engine) == 0
    assert get_column_index_from_name(table_oid, two_name, engine) == 1


def test_get_column_index_from_name_after_delete_two_tables(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    zero_name = "colzero"
    one_name = "colone"
    two_name = "coltwo"

    for suffix in ["1", "2"]:
        table = Table(
            table_name + suffix,
            MetaData(bind=engine, schema=schema),
            Column(zero_name + suffix, Integer),
            Column(one_name + suffix, String),
            Column(two_name + suffix, String),
        )
        table.create()

    with engine.begin() as conn:
        op = Operations(MigrationContext.configure(conn))
        op.drop_column(table_name + "1", one_name + "1", schema=schema)

    table_oid1 = get_oid_from_table(table_name + "1", schema, engine)
    table_oid2 = get_oid_from_table(table_name + "2", schema, engine)
    assert all(
        [
            get_column_index_from_name(table_oid1, zero_name + "1", engine) == 0,
            get_column_index_from_name(table_oid1, two_name + "1", engine) == 1,
            get_column_index_from_name(table_oid2, zero_name + "2", engine) == 0,
            get_column_index_from_name(table_oid2, one_name + "2", engine) == 1,
            get_column_index_from_name(table_oid2, two_name + "2", engine) == 2,
        ]
    )


@pytest.mark.parametrize("filler", [True, False])
@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_get_column_default(engine_with_schema, filler, col_type):
    engine, schema = engine_with_schema
    table_name = "get_column_default_table"
    column_name = "get_column_default_column"
    _, set_default, expt_default = column_test_dict[col_type].values()

    # Ensure we test one and multiple defaults in a table
    # There _was_ a bug associated with multiple defaults
    cols = [Column(column_name, col_type, server_default=set_default)]
    if filler:
        cols.append(Column("Filler", Integer, server_default="0"))
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        *cols
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)

    default = get_column_default(table_oid, 0, engine)
    created_default = get_default(engine, table)
    assert default == expt_default
    assert default == created_default


get_column_generated_default_test_list = [
    Column("generated_default_col", Integer, primary_key=True),
    Column("generated_default_col", Integer, Sequence("test_id")),
    Column("generated_default_col", DateTime, server_default=func.now()),
    Column("generated_default_col", DateTime, server_default=func.current_timestamp())
]


@pytest.mark.parametrize("col", get_column_generated_default_test_list)
def test_get_column_generated_default(engine_with_schema, col):
    engine, schema = engine_with_schema
    table_name = "get_column_generated_default_table"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        col,
    )
    table.create()
    table_oid = get_oid_from_table(table_name, schema, engine)
    default = get_column_default(table_oid, 0, engine)
    created_default = get_default(engine, table)

    # We shouldn't evaluate generated defaults
    assert default is None
    assert default != created_default


default_expression_test_list = [
    ("CURRENT_TIMESTAMP", True),
    ("CURRENT_TIMESTAMP::CHAR(64)", True),
    ("NOW()", True),
    ("myfunc()", True),
    ("now()", True),
    ("now()::VARCHAR", True),
    ("'now()'::VARCHAR", False),
    ("'3'::NUMERIC", False),
    ("'3'::CHAR", False),
    ("'abcde'::CHAR(3)", False),
    ("'abcde'::CHAR(5)", False),
]

@pytest.mark.parametrize("default_expr,is_dynamic", default_expression_test_list)
def test_is_default_expr_dynamic(default_expr, is_dynamic):
    default_clause = DefaultClause(text(default_expr))
    assert _is_default_expr_dynamic(default_clause) is is_dynamic
