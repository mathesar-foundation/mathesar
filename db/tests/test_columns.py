import re
from unittest.mock import patch
from psycopg2.errors import NotNullViolation
import pytest
from sqlalchemy import (
    String, Integer, ForeignKey, Column, select, Table, MetaData, create_engine,
    Numeric
)
from sqlalchemy.exc import IntegrityError
from db import columns, tables, constants
from db.types import email
from db.tests.types import fixtures

engine_with_types = fixtures.engine_with_types


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


def _rename_column(schema, table_name, old_col_name, new_col_name, engine):
    """
    Renames the colum of a table and assert the change went through
    """
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    column_index = columns.get_column_index_from_name(table_oid, old_col_name, engine)
    columns.rename_column(table_oid, column_index, new_col_name, engine)
    table = tables.reflect_table(table_name, schema, engine)
    assert new_col_name in table.columns
    assert old_col_name not in table.columns
    return table


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
    for default_col in columns.get_default_mathesar_column_list():
        assert default_col.is_default


def test_MC_is_default_when_false_for_name():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        col = columns.MathesarColumn(
            "definitely_not_a_default",
            dc_definition["sa_type"],
            primary_key=dc_definition.get("primary_key", False),
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_is_default_when_false_for_type():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        changed_type = Integer if dc_definition["sa_type"] == String else String
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
            dc_definition["sa_type"],
            primary_key=not_pk,
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_valid_target_types_no_engine():
    mc = columns.MathesarColumn('testable_col', String)
    assert mc.valid_target_types is None


def test_MC_valid_target_types_default_engine(engine):
    mc = columns.MathesarColumn('testable_col', String)
    mc.add_engine(engine)
    assert "VARCHAR" in mc.valid_target_types


def test_MC_valid_target_types_custom_engine(engine_with_types):
    mc = columns.MathesarColumn('testable_col', String)
    mc.add_engine(engine_with_types)
    assert "mathesar_types.email" in mc.valid_target_types


def test_MC_column_index_when_no_engine():
    mc = columns.MathesarColumn('testable_col', String)
    assert mc.column_index is None


def test_MC_column_index_when_no_table(engine):
    mc = columns.MathesarColumn('testable_col', String)
    mc.add_engine(engine)
    assert mc.column_index is None


def test_MC_column_index_when_no_db_table(engine):
    mc = columns.MathesarColumn('testable_col', String)
    mc.add_engine(engine)
    table = Table('atable', MetaData(), mc)
    assert mc.table == table and mc.column_index is None


def test_MC_column_index_single(engine_with_schema):
    engine, schema = engine_with_schema
    mc = columns.MathesarColumn('testable_col', String)
    mc.add_engine(engine)
    metadata = MetaData(bind=engine, schema=schema)
    Table('asupertable', metadata, mc).create()
    assert mc.column_index == 0


def test_MC_column_index_multiple(engine_with_schema):
    engine, schema = engine_with_schema
    mc_1 = columns.MathesarColumn('testable_col', String)
    mc_2 = columns.MathesarColumn('testable_col2', String)
    mc_1.add_engine(engine)
    mc_2.add_engine(engine)
    metadata = MetaData(bind=engine, schema=schema)
    Table('asupertable', metadata, mc_1, mc_2).create()
    assert mc_1.column_index == 0
    assert mc_2.column_index == 1


def test_MC_plain_type_no_opts(engine):
    mc = columns.MathesarColumn('acolumn', String)
    mc.add_engine(engine)
    assert mc.plain_type == "VARCHAR"


def test_MC_plain_type_no_opts_custom_type(engine_with_types):
    mc = columns.MathesarColumn('testable_col', email.Email)
    mc.add_engine(engine_with_types)
    assert mc.plain_type == "mathesar_types.email"


def test_MC_plain_type_numeric_opts(engine):
    mc = columns.MathesarColumn('testable_col', Numeric(5, 2))
    mc.add_engine(engine)
    assert mc.plain_type == "NUMERIC"


def test_MC_type_options_no_opts(engine):
    mc = columns.MathesarColumn('testable_col', Numeric)
    mc.add_engine(engine)
    assert mc.type_options is None


def test_MC_type_options(engine):
    mc = columns.MathesarColumn('testable_col', Numeric(5, 2))
    mc.add_engine(engine)
    assert mc.type_options == {'precision': 5, 'scale': 2}


@pytest.mark.parametrize(
    "column_dict,func_name",
    [
        ({"name": "blah"}, "rename_column"),
        ({"sa_type": "blah"}, "retype_column"),
        ({"type": "blah"}, "retype_column"),
        ({"nullable": True}, "change_column_nullable"),
    ]
)
def test_alter_column_chooses_wisely(column_dict, func_name):
    engine = create_engine("postgresql://")
    with patch.object(columns, func_name) as mock_alterer:
        columns.alter_column(
            engine,
            1234,
            5678,
            column_dict
        )
    mock_alterer.assert_called_with(
        1234,
        5678,
        list(column_dict.values())[0],
        engine,
        type_options={},
    )


def test_alter_column_adds_type_options():
    engine = create_engine("postgresql://")
    column_dict = {"type": "numeric", "type_options": {"precision": 3}}
    with patch.object(columns, "retype_column") as mock_retyper:
        columns.alter_column(
            engine,
            1234,
            5678,
            column_dict
        )
    mock_retyper.assert_called_with(
        1234,
        5678,
        column_dict["type"],
        engine,
        type_options=column_dict["type_options"],
    )


def test_rename_column(engine_with_schema):
    old_col_name = "col1"
    new_col_name = "col2"
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    Table(table_name, metadata, Column(old_col_name, String)).create()
    _rename_column(schema, table_name, old_col_name, new_col_name, engine)


def test_rename_column_foreign_keys(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_to_split"
    columns_list = [Column("Filler 1", Integer), Column("Filler 2", Integer)]
    tables.create_mathesar_table(table_name, schema, columns_list, engine)
    extracted, remainder, fk_name = tables.extract_columns_from_table(
        table_name, ["Filler 1"], "Extracted", "Remainder", schema, engine
    )
    new_fk_name = "new_" + fk_name
    remainder = _rename_column(schema, remainder.name, fk_name, new_fk_name, engine)

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

    table = _rename_column(schema, table_name, old_col_name, new_col_name, engine)

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

    table = _rename_column(schema, table_name, old_col_name, new_col_name, engine)

    with engine.begin() as conn:
        index = engine.dialect.get_indexes(conn, table_name, schema)[0]
        index_columns = index["column_names"]
    assert old_col_name not in index_columns
    assert new_col_name in index_columns


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
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    assert columns.get_column_index_from_name(table_oid, zero_name, engine) == 0
    assert columns.get_column_index_from_name(table_oid, one_name, engine) == 1


def test_retype_column_correct_column(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = "boolean"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    with patch.object(columns.alteration, "alter_column_type") as mock_retyper:
        columns.retype_column(table_oid, 0, target_type, engine)
    mock_retyper.assert_called_with(
        schema,
        table_name,
        target_column_name,
        "boolean",
        engine,
        friendly_names=False,
        type_options={},
    )


def test_retype_column_adds_options(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = "numeric"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    type_options = {"precision": 5}
    with patch.object(columns.alteration, "alter_column_type") as mock_retyper:
        columns.retype_column(table_oid, 0, target_type, engine, type_options=type_options)
    mock_retyper.assert_called_with(
        schema,
        table_name,
        target_column_name,
        "numeric",
        engine,
        friendly_names=False,
        type_options=type_options,
    )


def test_create_column(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = "BOOLEAN"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, Integer),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    column_data = {"name": new_column_name, "type": target_type}
    created_col = columns.create_column(engine, table_oid, column_data)
    altered_table = tables.reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == new_column_name
    assert created_col.type.compile(engine.dialect) == "BOOLEAN"


def test_create_column_options(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = "NUMERIC"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, Integer),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type,
        "type_options": {"precision": 5, "scale": 3},
    }
    created_col = columns.create_column(engine, table_oid, column_data)
    altered_table = tables.reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == new_column_name
    assert created_col.plain_type == "NUMERIC"
    assert created_col.type_options == {"precision": 5, "scale": 3}


def test_create_column_bad_options(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_type = "BOOLEAN"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, Integer),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type,
        "type_options": {"precision": 5, "scale": 3},
    }
    with pytest.raises(TypeError):
        created_col = columns.create_column(engine, table_oid, column_data)


nullable_changes = [(True, True), (False, False), (True, False), (False, True)]


@pytest.mark.parametrize("nullable_tup", nullable_changes)
def test_change_column_nullable_changes(engine_with_schema, nullable_tup):
    engine, schema = engine_with_schema
    table_name = "atablefornulling"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer, nullable=nullable_tup[0]),
        Column(nontarget_column_name, String),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    changed_column = columns.change_column_nullable(
        table_oid,
        0,
        nullable_tup[1],
        engine
    )
    assert changed_column.nullable is nullable_tup[1]


@pytest.mark.parametrize("nullable_tup", nullable_changes)
def test_change_column_nullable_with_data(engine_with_schema, nullable_tup):
    engine, schema = engine_with_schema
    table_name = "atablefornulling"
    target_column_name = "thecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer, nullable=nullable_tup[0]),
    )
    table.create()
    ins = table.insert().values(
        [
            {target_column_name: 1},
            {target_column_name: 2},
            {target_column_name: 3},
        ]
    )
    with engine.begin() as conn:
        conn.execute(ins)
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    changed_column = columns.change_column_nullable(
        table_oid,
        0,
        nullable_tup[1],
        engine
    )
    assert changed_column.nullable is nullable_tup[1]


def test_change_column_nullable_changes_raises_with_null_data(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atablefornulling"
    target_column_name = "thecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer, nullable=True),
    )
    table.create()
    ins = table.insert().values(
        [
            {target_column_name: 1},
            {target_column_name: 2},
            {target_column_name: None},
        ]
    )
    with engine.begin() as conn:
        conn.execute(ins)
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    with pytest.raises(IntegrityError) as e:
        columns.change_column_nullable(
            table_oid,
            0,
            False,
            engine
        )
        assert type(e.orig) == NotNullViolation


def test_drop_column_correct_column(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "thecolumntodrop"
    nontarget_column_name = "notthecolumntodrop"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    table_oid = tables.get_oid_from_table(table_name, schema, engine)
    columns.drop_column(engine, table_oid, 0)
    altered_table = tables.reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 1
    assert nontarget_column_name in altered_table.columns
    assert target_column_name not in altered_table.columns


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
