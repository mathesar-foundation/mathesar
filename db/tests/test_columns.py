import re
import pytest
from sqlalchemy import String, Integer, ForeignKey, Column, select, Table, MetaData
from db import columns, tables, constants

from .test_tables import ROSTER, EXTRACTED_COLS, TEACHERS, ROSTER_NO_TEACHERS


def init_column(*args, **kwargs):
    return columns.MathesarColumn(*args, **kwargs)


def from_column_column(*args, **kwargs):
    """
    This creates a condition to check that the MathesarColumn.from_column
    class method returns the same value of the original __init__ for a given
    input.
    """
    col = columns.MathesarColumn(*args, **kwargs)
    return columns.MathesarColumn.from_column(col)


column_builder_list = [init_column, from_column_column]


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_name(column_builder):
    name = "mycol"
    col = column_builder(name, String)
    assert col.name == name


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_sa_type(column_builder):
    sa_type = String
    col = column_builder("anycol", sa_type)
    actual_cls = col.type.__class__
    assert actual_cls == sa_type


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_default_not_primary_key(column_builder):
    col = column_builder("anycol", String)
    assert not col.primary_key


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_primary_key_true(column_builder):
    col = column_builder("anycol", String, primary_key=True)
    assert col.primary_key


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_default_nullable(column_builder):
    col = column_builder("a_col", String)
    assert col.nullable


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_nullable_false(column_builder):
    col = column_builder("a_col", String, nullable=False)
    assert not col.nullable


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_foreign_keys_empty(column_builder):
    col = column_builder("some_col", String)
    assert not col.foreign_keys


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_non_empty_foreign_keys(column_builder):
    fk_target = "some_schema.some_table.a_column"
    col = column_builder(
        "anew_col", String, foreign_keys={ForeignKey(fk_target)},
    )
    fk_names = [fk.target_fullname for fk in col.foreign_keys]
    assert len(fk_names) == 1 and fk_names[0] == fk_target


def test_MC_is_default_when_true():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        col = columns.MathesarColumn(
            default_col,
            dc_definition["type"],
            primary_key=dc_definition.get("primary_key", False),
            nullable=dc_definition.get("nullable", True),
        )
        assert col.is_default


def test_MC_is_default_when_false_for_name():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        col = columns.MathesarColumn(
            "definitely_not_a_default",
            dc_definition["type"],
            primary_key=dc_definition.get("primary_key", False),
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_is_default_when_false_for_type():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        changed_type = Integer if dc_definition["type"] == String else String
        col = columns.MathesarColumn(
            default_col,
            changed_type,
            primary_key=dc_definition.get("primary_key", False),
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_is_default_when_false_for_pk():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        not_pk = not dc_definition.get("primary_key", False),
        col = columns.MathesarColumn(
            default_col,
            dc_definition["type"],
            primary_key=not_pk,
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_rename_column(engine_with_schema):
    old_col_name = "col1"
    new_col_name = "col2"
    column_list = [Column(old_col_name, String)]
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    table = tables.create_mathesar_table(table_name, schema, column_list, engine)
    columns.rename_column(schema, table_name, old_col_name, new_col_name, engine)
    table = tables.reflect_table(table_name, schema, engine)
    assert new_col_name in table.columns
    assert old_col_name not in table.columns


def test_rename_column_foreign_keys(engine_with_roster):
    engine, schema = engine_with_roster
    extracted, remainder, fk_name = tables.extract_columns_from_table(
        ROSTER,
        EXTRACTED_COLS,
        TEACHERS,
        ROSTER_NO_TEACHERS,
        schema,
        engine,
    )
    new_fk_name = "new_" + fk_name
    columns.rename_column(schema, remainder.name, fk_name, new_fk_name, engine)
    remainder = tables.reflect_table(remainder.name, schema, engine)
    extracted = tables.reflect_table(extracted.name, schema, engine)

    assert new_fk_name in remainder.columns
    assert fk_name not in remainder.columns

    fk = list(remainder.foreign_keys)[0]
    assert fk.parent.name == new_fk_name
    assert fk.column.table.name == extracted.name


def test_rename_column_sequence(engine_with_schema):
    old_col_name = constants.ID
    new_col_name = "new_" + constants.ID
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    table = tables.create_mathesar_table(table_name, schema, [], engine)
    with engine.begin() as conn:
        ins = table.insert()
        conn.execute(ins)

    columns.rename_column(schema, table_name, old_col_name, new_col_name, engine)
    table = tables.reflect_table(table_name, schema, engine)
    assert new_col_name in table.columns
    assert old_col_name not in table.columns

    with engine.begin() as conn:
        ins = table.insert()
        conn.execute(ins)
        slct = select(table)
        result = conn.execute(slct)
    new_value = result.fetchall()[-1][new_col_name]
    assert new_value == 2


def test_rename_column_index(engine_with_schema):
    old_col_name = constants.ID
    new_col_name = "new_" + constants.ID
    engine, schema = engine_with_schema
    table_name = "table_with_index"
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column(old_col_name, Integer, index=True))
    table.create()

    columns.rename_column(schema, table_name, old_col_name, new_col_name, engine)
    table = tables.reflect_table(table_name, schema, engine)
    assert new_col_name in table.columns
    assert old_col_name not in table.columns
    with engine.begin() as conn:
        index = engine.dialect.get_indexes(conn, table_name, schema)[0]
        index_columns = index["column_names"]
    assert old_col_name not in index_columns
    assert new_col_name in index_columns


def get_mathesar_column_init_args():
    init_code = columns.MathesarColumn.__init__.__code__
    return init_code.co_varnames[1:init_code.co_argcount]


@pytest.mark.parametrize("mathesar_col_arg", get_mathesar_column_init_args())
def test_test_columns_covers_MathesarColumn(mathesar_col_arg):
    """
    This is a meta-test to require at least one test for each __init__
    arg of the column object. It is stupid, and only checks function
    names. To get it to pass, make a test function with "test_MC_inits"
    and <param> in the name. It is the responsibility of the implementer
    of new arguments to MathesarColumn to ensure the tests they write are
    valid.
    """
    test_funcs = [var_name for var_name in globals() if var_name[:4] == "test"]
    pattern = re.compile(r"test_MC_inits\S*{}\S*".format(mathesar_col_arg))
    number_tests = len(
        [func for func in test_funcs if pattern.match(func) is not None]
    )
    assert number_tests > 0
