import re
from datetime import date

from unittest.mock import patch
from psycopg2.errors import NotNullViolation
import pytest
from sqlalchemy import (
    String, Integer, Boolean, Date, ForeignKey, Column, select, Table, MetaData,
    Sequence, Numeric, DateTime, func, UniqueConstraint,
)
from sqlalchemy.exc import IntegrityError
from db import columns, constants
from db.tables import operations as table_operations
from db.constraints import operations as constraint_operations
from db.tables import utils as table_utils
from db.types import email, alteration
from db.types.base import get_db_type_name
from db.tests.types import fixtures


engine_with_types = fixtures.engine_with_types
temporary_testing_schema = fixtures.temporary_testing_schema
engine_email_type = fixtures.engine_email_type


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


def _rename_column(table, old_col_name, new_col_name, engine):
    """
    Renames the colum of a table and assert the change went through
    """
    table_oid = table_utils.get_oid_from_table(table.name, table.schema, engine)
    column_index = columns.get_column_index_from_name(table_oid, old_col_name, engine)
    with engine.begin() as conn:
        columns.rename_column(table, column_index, engine, conn, new_col_name)
    table = table_utils.reflect_table(table.name, table.schema, engine)
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


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_server_default_none(column_builder):
    col = column_builder("some_col", String)
    assert col.server_default is None


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
    assert "MATHESAR_TYPES.EMAIL" in mc.valid_target_types


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
    assert mc.plain_type == "MATHESAR_TYPES.EMAIL"


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
        ({"plain_type": "blah"}, "retype_column"),
        ({"nullable": True}, "change_column_nullable"),
        ({"default_value": 1}, "set_column_default"),
    ]
)
def test_alter_column_chooses_wisely(column_dict, func_name, engine_with_schema):
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column('col', String))
    table.create()
    table_oid = table_utils.get_oid_from_table(table.name, table.schema, engine)

    with patch.object(columns, func_name) as mock_alterer:
        columns.alter_column(
            engine,
            table_oid,
            0,
            column_dict
        )
        mock_alterer.assert_called_once()


def test_rename_column(engine_with_schema):
    old_col_name = "col1"
    new_col_name = "col2"
    table_name = "table_with_columns"
    engine, schema = engine_with_schema
    metadata = MetaData(bind=engine, schema=schema)
    table = Table(table_name, metadata, Column(old_col_name, String))
    table.create()
    _rename_column(table, old_col_name, new_col_name, engine)


def test_rename_column_foreign_keys(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "table_to_split"
    columns_list = [Column("Filler 1", Integer), Column("Filler 2", Integer)]
    table_operations.create_mathesar_table(table_name, schema, columns_list, engine)
    extracted, remainder, fk_name = table_operations.extract_columns_from_table(
        table_name, ["Filler 1"], "Extracted", "Remainder", schema, engine
    )
    new_fk_name = "new_" + fk_name
    remainder = _rename_column(remainder, fk_name, new_fk_name, engine)

    fk = list(remainder.foreign_keys)[0]
    assert fk.parent.name == new_fk_name
    assert fk.column.table.name == extracted.name


def test_rename_column_sequence(engine_with_schema):
    old_col_name = constants.ID
    new_col_name = "new_" + constants.ID
    engine, schema = engine_with_schema
    table_name = "table_with_columns"
    table = table_operations.create_mathesar_table(table_name, schema, [], engine)
    with engine.begin() as conn:
        ins = table.insert()
        conn.execute(ins)

    table = _rename_column(table, old_col_name, new_col_name, engine)

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

    table = _rename_column(table, old_col_name, new_col_name, engine)

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
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
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
    with engine.begin() as conn:
        with patch.object(columns.alteration, "alter_column_type") as mock_retyper:
            columns.retype_column(table, 0, engine, conn, target_type)
        mock_retyper.assert_called_with(
            table,
            target_column_name,
            engine,
            conn,
            "boolean",
            {},
            friendly_names=False
        )


@pytest.mark.parametrize('target_type', ['numeric', 'decimal'])
def test_retype_column_adds_options(engine_with_schema, target_type):
    engine, schema = engine_with_schema
    table_name = "atableone"
    target_column_name = "thecolumntochange"
    nontarget_column_name = "notthecolumntochange"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Integer),
        Column(nontarget_column_name, String),
    )
    table.create()
    type_options = {"precision": 5}
    with engine.begin() as conn:
        with patch.object(columns.alteration, "alter_column_type") as mock_retyper:
            columns.retype_column(table, 0, engine, conn, target_type, type_options)
        mock_retyper.assert_called_with(
            table,
            target_column_name,
            engine,
            conn,
            target_type,
            type_options,
            friendly_names=False
        )


type_set = {
    'BIGINT',
    'BOOLEAN',
    'DECIMAL',
    'DOUBLE PRECISION',
    'FLOAT',
    'INTEGER',
    'INTERVAL',
    'MATHESAR_TYPES.EMAIL',
    'NUMERIC',
    'REAL',
    'SMALLINT',
    'VARCHAR',
    'TEXT',
    'DATE',
}


def test_type_list_completeness(engine_with_types):
    """
    This metatest ensures that tests parameterized on the type_set
    use the entire set supported.
    """
    actual_supported_db_types = alteration.get_supported_alter_column_db_types(
        engine_with_types
    )
    assert type_set == actual_supported_db_types


@pytest.mark.parametrize("target_type", type_set)
def test_create_column(engine_email_type, target_type):
    engine, schema = engine_email_type
    table_name = "atableone"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    input_output_type_map = {type_: type_ for type_ in type_set}
    # update the map with types that reflect differently than they're
    # set when creating a column
    input_output_type_map.update({'FLOAT': 'DOUBLE PRECISION', 'DECIMAL': 'NUMERIC'})
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, Integer),
    )
    table.create()
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    column_data = {"name": new_column_name, "type": target_type}
    created_col = columns.create_column(engine, table_oid, column_data)
    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 2
    assert created_col.name == new_column_name
    assert created_col.type.compile(engine.dialect) == input_output_type_map[target_type]


@pytest.mark.parametrize("target_type", ["NUMERIC", "DECIMAL"])
def test_create_column_options(engine_email_type, target_type):
    engine, schema = engine_email_type
    table_name = "atableone"
    initial_column_name = "original_column"
    new_column_name = "added_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(initial_column_name, Integer),
    )
    table.create()
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type,
        "type_options": {"precision": 5, "scale": 3},
    }
    created_col = columns.create_column(engine, table_oid, column_data)
    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
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
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    column_data = {
        "name": new_column_name,
        "type": target_type,
        "type_options": {"precision": 5, "scale": 3},
    }
    with pytest.raises(TypeError):
        columns.create_column(engine, table_oid, column_data)


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
    with engine.begin() as conn:
        columns.change_column_nullable(
            table,
            0,
            engine,
            conn,
            nullable_tup[1],
        )
    changed_table = table_utils.reflect_table(table_name, schema, engine)
    changed_column = columns.get_mathesar_column_with_engine(
        changed_table.columns[0],
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
    with engine.begin() as conn:
        columns.change_column_nullable(
            table,
            0,
            engine,
            conn,
            nullable_tup[1],
        )
    changed_table = table_utils.reflect_table(table_name, schema, engine)
    changed_column = columns.get_mathesar_column_with_engine(
        changed_table.columns[0],
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
    with engine.begin() as conn:
        with pytest.raises(IntegrityError) as e:
            columns.change_column_nullable(
                table,
                0,
                engine,
                conn,
                False,
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
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    columns.drop_column(table_oid, 0, engine)
    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    assert len(altered_table.columns) == 1
    assert nontarget_column_name in altered_table.columns
    assert target_column_name not in altered_table.columns


def _get_default(engine, table):
    with engine.begin() as conn:
        conn.execute(table.insert())
        return conn.execute(select(table)).fetchall()[0][0]


column_test_dict = {
    Integer: {"start": "0", "set": "5", "expt": 5},
    String: {"start": "default", "set": "test", "expt": "test"},
    Boolean: {"start": "false", "set": "true", "expt": True},
    Date: {"start": "2019-01-01", "set": "2020-01-01", "expt": date(2020, 1, 1)}
}


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
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)

    default = columns.get_column_default(table_oid, 0, engine)
    created_default = _get_default(engine, table)
    assert default == expt_default
    assert default == created_default


get_column_generated_default_test_list = [
    Column("generated_default_col", Integer, primary_key=True),
    Column("generated_default_col", Integer, Sequence("test_id")),
    Column("generated_default_col", DateTime, server_default=func.now())
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
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    default = columns.get_column_default(table_oid, 0, engine)
    created_default = _get_default(engine, table)

    # We shouldn't evaluate generated defaults
    assert default is None
    assert default != created_default


@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_column_default_create(engine_with_schema, col_type):
    engine, schema = engine_with_schema
    table_name = "create_column_default_table"
    column_name = "create_column_default_column"
    _, set_default, expt_default = column_test_dict[col_type].values()
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(column_name, col_type)
    )
    table.create()

    with engine.begin() as conn:
        columns.set_column_default(table, 0, engine, conn, set_default)
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    default = columns.get_column_default(table_oid, 0, engine)
    created_default = _get_default(engine, table)

    assert default == expt_default
    assert created_default == expt_default


@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_column_default_update(engine_with_schema, col_type):
    engine, schema = engine_with_schema
    table_name = "update_column_default_table"
    column_name = "update_column_default_column"
    start_default, set_default, expt_default = column_test_dict[col_type].values()
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(column_name, col_type, server_default=start_default)
    )
    table.create()

    with engine.begin() as conn:
        columns.set_column_default(table, 0, engine, conn, set_default)
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    default = columns.get_column_default(table_oid, 0, engine)
    created_default = _get_default(engine, table)

    assert default != start_default
    assert default == expt_default
    assert created_default == expt_default


@pytest.mark.parametrize("col_type", column_test_dict.keys())
def test_column_default_delete(engine_with_schema, col_type):
    engine, schema = engine_with_schema
    table_name = "delete_column_default_table"
    column_name = "delete_column_default_column"
    _, set_default, _ = column_test_dict[col_type].values()
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(column_name, col_type, server_default=set_default)
    )
    table.create()

    with engine.begin() as conn:
        columns.set_column_default(table, 0, engine, conn, None)
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    default = columns.get_column_default(table_oid, 0, engine)
    created_default = _get_default(engine, table)

    assert default is None
    assert created_default is None


duplicate_column_options = [
    (True, True),
    (True, False),
    (False, True),
    (False, False),
]


def _check_duplicate_data(table_oid, engine, copy_data):
    table = table_utils.reflect_table_from_oid(table_oid, engine)

    with engine.begin() as conn:
        rows = conn.execute(table.select()).fetchall()
    if copy_data:
        assert all([row[0] == row[-1] for row in rows])
    else:
        assert all([row[-1] is None for row in rows])


def _check_duplicate_unique_constraint(
    table_oid, col_index, con_idxs, engine, copy_constraints
):
    constraints_ = constraint_operations.get_column_constraints(col_index, table_oid, engine)
    if copy_constraints:
        assert len(constraints_) == 1
        constraint = constraints_[0]
        assert constraint.contype == "u"
        assert set([con - 1 for con in constraint.conkey]) == set(con_idxs)
    else:
        assert len(constraints_) == 0


def _create_table(table_name, cols, insert_data, schema, engine):
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        *cols
    )
    table.create()
    with engine.begin() as conn:
        for data in insert_data:
            conn.execute(table.insert().values(data))
    return table


def test_duplicate_column_name(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atable"
    new_col_name = "duplicated_column"
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column("Filler", Numeric)
    )
    table.create()
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    columns.duplicate_column(table_oid, 0, engine, new_col_name)
    table = table_utils.reflect_table_from_oid(table_oid, engine)
    assert new_col_name in table.c


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
def test_duplicate_column_single_unique(engine_with_schema, copy_data, copy_constraints):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    cols = [Column(target_column_name, Numeric, unique=True)]
    insert_data = [(1,), (2,), (3,)]
    _create_table(table_name, cols, insert_data, schema, engine)

    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    columns.duplicate_column(
        table_oid, 0, engine, new_col_name, copy_data, copy_constraints
    )

    col_index = columns.get_column_index_from_name(table_oid, new_col_name, engine)
    _check_duplicate_data(table_oid, engine, copy_data)
    _check_duplicate_unique_constraint(
        table_oid, col_index, [col_index], engine, copy_constraints
    )


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
def test_duplicate_column_multi_unique(engine_with_schema, copy_data, copy_constraints):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    cols = [
        Column(target_column_name, Numeric),
        Column("Filler", Numeric),
        UniqueConstraint(target_column_name, "Filler")
    ]
    insert_data = [(1, 2), (2, 3), (3, 4)]
    _create_table(table_name, cols, insert_data, schema, engine)

    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    columns.duplicate_column(
        table_oid, 0, engine, new_col_name, copy_data, copy_constraints
    )

    col_index = columns.get_column_index_from_name(table_oid, new_col_name, engine)
    _check_duplicate_data(table_oid, engine, copy_data)
    _check_duplicate_unique_constraint(
        table_oid, col_index, [1, col_index], engine, copy_constraints
    )


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
@pytest.mark.parametrize('nullable', [True, False])
def test_duplicate_column_nullable(
    engine_with_schema, nullable, copy_data, copy_constraints
):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    cols = [Column(target_column_name, Numeric, nullable=nullable)]
    insert_data = [(1,), (2,), (3,)]
    _create_table(table_name, cols, insert_data, schema, engine)

    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    col = columns.duplicate_column(
        table_oid, 0, engine, new_col_name, copy_data, copy_constraints
    )

    _check_duplicate_data(table_oid, engine, copy_data)
    # Nullability constriant is only copied when data is
    # Otherwise, it defaults to True
    if copy_constraints and copy_data:
        assert col.nullable == nullable
    else:
        assert col.nullable is True


def test_duplicate_non_unique_constraint(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    insert_data = [(1,), (2,), (3,)]
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column(target_column_name, Numeric, primary_key=True),
    )
    table.create()
    with engine.begin() as conn:
        for data in insert_data:
            conn.execute(table.insert().values(data))

    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    col = columns.duplicate_column(table_oid, 0, engine, new_col_name)

    _check_duplicate_data(table_oid, engine, True)
    assert col.primary_key is False


@pytest.mark.parametrize('copy_data,copy_constraints', duplicate_column_options)
def test_duplicate_column_default(engine_with_schema, copy_data, copy_constraints):
    engine, schema = engine_with_schema
    table_name = "atable"
    target_column_name = "columtoduplicate"
    new_col_name = "duplicated_column"
    expt_default = 1
    cols = [Column(target_column_name, Numeric, server_default=str(expt_default))]
    _create_table(table_name, cols, [], schema, engine)

    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    columns.duplicate_column(
        table_oid, 0, engine, new_col_name, copy_data, copy_constraints
    )

    col_index = columns.get_column_index_from_name(table_oid, new_col_name, engine)
    default = columns.get_column_default(table_oid, col_index, engine)
    if copy_data:
        assert default == expt_default
    else:
        assert default is None


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


def _create_pizza_table(engine, schema):
    table_name = 'Pizzas'
    cols = [
        Column('ID', String),
        Column('Pizza', String),
        Column('Checkbox', String),
        Column('Rating', String)
    ]
    insert_data = [
        ('1', 'Pepperoni', 'true', '4.0'),
        ('2', 'Supreme', 'false', '5.0'),
        ('3', 'Hawaiian', 'true', '3.5')
    ]
    return _create_table(table_name, cols, insert_data, schema, engine)


def _get_pizza_column_data():
    return [{
        'name': 'ID',
        'plain_type': 'VARCHAR'
    }, {
        'name': 'Pizza',
        'plain_type': 'VARCHAR'
    }, {
        'name': 'Checkbox',
        'plain_type': 'VARCHAR'
    }, {
        'name': 'Rating',
        'plain_type': 'VARCHAR'
    }]


def test_batch_update_columns_no_changes(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = table_utils.get_oid_from_table(table.name, schema, engine)

    columns.batch_update_columns(table_oid, engine, _get_pizza_column_data())
    updated_table = table_utils.reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine_email_type)
        assert new_column_type == 'VARCHAR'
        assert updated_table.columns[index].name == table.columns[index].name


def test_batch_update_column_names(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = table_utils.get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[1]['name'] == 'Pizza Style'
    column_data[2]['name'] == 'Eaten Recently?'

    columns.batch_update_columns(table_oid, engine, column_data)
    updated_table = table_utils.reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine_email_type)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_types(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = table_utils.get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0]['plain_type'] == 'INTEGER'
    column_data[2]['plain_type'] == 'BOOLEAN'

    columns.batch_update_columns(table_oid, engine, column_data)
    updated_table = table_utils.reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine_email_type)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_names_and_types(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = table_utils.get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0]['name'] == 'Pizza ID'
    column_data[0]['plain_type'] == 'INTEGER'
    column_data[1]['name'] == 'Pizza Style'
    column_data[2]['plain_type'] == 'BOOLEAN'

    columns.batch_update_columns(table_oid, engine, column_data)
    updated_table = table_utils.reflect_table(table.name, schema, engine)

    assert len(table.columns) == len(updated_table.columns)
    for index, column in enumerate(table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine_email_type)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']


def test_batch_update_column_drop_columns(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = table_utils.get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0] = {}
    column_data[1] = {}

    columns.batch_update_columns(table_oid, engine, column_data)
    updated_table = table_utils.reflect_table(table.name, schema, engine)

    assert len(updated_table.columns) == len(table.columns) - 2
    for index, column in enumerate(updated_table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine_email_type)
        assert new_column_type == column_data[index - 2]['plain_type']
        assert updated_table.columns[index].name == column_data[index - 2]['name']


def test_batch_update_column_all_operations(engine_email_type):
    engine, schema = engine_email_type
    table = _create_pizza_table(engine, schema)
    table_oid = table_utils.get_oid_from_table(table.name, schema, engine)

    column_data = _get_pizza_column_data()
    column_data[0]['name'] = 'Pizza ID'
    column_data[0]['plain_type'] = 'INTEGER'
    column_data[1]['name'] = 'Pizza Style'
    column_data[2]['plain_type'] = 'BOOLEAN'
    column_data[3] = {}

    columns.batch_update_columns(table_oid, engine, column_data)
    updated_table = table_utils.reflect_table(table.name, schema, engine)

    assert len(updated_table.columns) == len(table.columns) - 1
    for index, column in enumerate(updated_table.columns):
        new_column_type = get_db_type_name(updated_table.columns[index].type, engine_email_type)
        assert new_column_type == column_data[index]['plain_type']
        assert updated_table.columns[index].name == column_data[index]['name']
