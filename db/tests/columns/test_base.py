import re

import pytest
from sqlalchemy import (
    INTEGER, ForeignKey, VARCHAR, CHAR, NUMERIC, ARRAY, JSON
)
from sqlalchemy.sql.sqltypes import NullType

from db.columns.base import MathesarColumn
from db.columns.defaults import DEFAULT_COLUMNS
from db.columns.utils import get_default_mathesar_column_list
from db.types.custom import email, datetime
from db.types.base import MathesarCustomType, PostgresType, UnknownDbTypeId


def init_column(*args, **kwargs):
    return MathesarColumn(*args, **kwargs)


def from_column_column(*args, **kwargs):
    """
    This creates a condition to check that the MathesarColumn.from_column
    class method returns the same value of the original __init__ for a given
    input.
    """
    col = MathesarColumn(*args, **kwargs)
    return MathesarColumn.from_column(col)


column_builder_list = [init_column, from_column_column]


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_name(column_builder):
    name = "mycol"
    col = column_builder(name, VARCHAR)
    assert col.name == name


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_sa_type(column_builder):
    sa_type = VARCHAR
    col = column_builder("anycol", sa_type)
    actual_cls = col.type.__class__
    assert actual_cls == sa_type


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_default_not_primary_key(column_builder):
    col = column_builder("anycol", VARCHAR)
    assert not col.primary_key


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_primary_key_true(column_builder):
    col = column_builder("anycol", VARCHAR, primary_key=True)
    assert col.primary_key


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_default_nullable(column_builder):
    col = column_builder("a_col", VARCHAR)
    assert col.nullable


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_nullable_false(column_builder):
    col = column_builder("a_col", VARCHAR, nullable=False)
    assert not col.nullable


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_foreign_keys_empty(column_builder):
    col = column_builder("some_col", VARCHAR)
    assert not col.foreign_keys


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_non_empty_foreign_keys(column_builder):
    fk_target = "some_schema.some_table.a_column"
    col = column_builder(
        "anew_col", VARCHAR, foreign_keys={ForeignKey(fk_target)},
    )
    fk_names = [fk.target_fullname for fk in col.foreign_keys]
    assert len(fk_names) == 1 and fk_names[0] == fk_target


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_autoincrement_false(column_builder):
    col = column_builder("anycol", VARCHAR)
    assert not col.autoincrement


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_autoincrement_true(column_builder):
    col = column_builder("anycol", VARCHAR, autoincrement=True)
    assert col.autoincrement


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_server_default_none(column_builder):
    col = column_builder("some_col", VARCHAR)
    assert col.server_default is None


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_engine_empty(column_builder):
    col = column_builder("some_col", VARCHAR)
    assert col.server_default is None


def test_MC_is_default_when_true():
    for default_col in get_default_mathesar_column_list():
        assert default_col.is_default


def test_MC_is_default_when_false_for_name():
    for default_col in DEFAULT_COLUMNS:
        dc_definition = DEFAULT_COLUMNS[default_col]
        col = MathesarColumn(
            "definitely_not_a_default",
            dc_definition["sa_type"],
            primary_key=dc_definition.get("primary_key", False),
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_is_default_when_false_for_type():
    for default_col in DEFAULT_COLUMNS:
        dc_definition = DEFAULT_COLUMNS[default_col]
        changed_type = INTEGER if dc_definition["sa_type"] == VARCHAR else VARCHAR
        col = MathesarColumn(
            default_col,
            changed_type,
            primary_key=dc_definition.get("primary_key", False),
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_is_default_when_false_for_pk():
    for default_col in DEFAULT_COLUMNS:
        dc_definition = DEFAULT_COLUMNS[default_col]
        not_pk = not dc_definition.get("primary_key", False),
        col = MathesarColumn(
            default_col,
            dc_definition["sa_type"],
            primary_key=not_pk,
            nullable=dc_definition.get("nullable", True),
        )
        assert not col.is_default


def test_MC_valid_target_types_no_engine():
    mc = MathesarColumn('testable_col', VARCHAR)
    assert mc.valid_target_types is None


def test_MC_valid_target_types_default_engine(engine):
    mc = MathesarColumn('testable_col', PostgresType.CHARACTER_VARYING.get_sa_class(engine))
    mc.add_engine(engine)
    assert mc.valid_target_types is not None
    assert PostgresType.CHARACTER_VARYING in mc.valid_target_types


def test_MC_valid_target_types_custom_engine(engine):
    mc = MathesarColumn('testable_col', VARCHAR)
    mc.add_engine(engine)
    assert mc.valid_target_types is not None
    assert MathesarCustomType.EMAIL in mc.valid_target_types


def test_MC_type_no_opts(engine):
    mc = MathesarColumn('acolumn', VARCHAR)
    mc.add_engine(engine)
    assert mc.db_type == PostgresType.CHARACTER_VARYING


@pytest.mark.parametrize(
    "sa_type,db_type",
    [
        (email.Email, MathesarCustomType.EMAIL),
        (NUMERIC(5, 2), PostgresType.NUMERIC),
        (NullType(), None),
        (ARRAY(INTEGER), None),
        (JSON(), None),
    ]
)
def test_MC_db_type_no_opts_custom_type(
    engine, sa_type, db_type
):
    mc = MathesarColumn('testable_col', sa_type)
    mc.add_engine(engine)
    if db_type is not None:
        assert mc.db_type == db_type
    else:
        with pytest.raises(UnknownDbTypeId):
            mc.db_type


def test_MC_type_options_no_opts(engine):
    mc = MathesarColumn('testable_col', NUMERIC)
    mc.add_engine(engine)
    assert mc.type_options is None


def test_MC_type_options(engine):
    mc = MathesarColumn('testable_col', NUMERIC(5, 2))
    mc.add_engine(engine)
    assert mc.type_options == {'precision': 5, 'scale': 2}


@pytest.mark.parametrize(
    "target_type,type_options",
    [(VARCHAR(3), {'length': 3}), (CHAR(4), {'length': 4})]
)
def test_MC_type_options_str(engine, target_type, type_options):
    mc = MathesarColumn('testable_col', target_type)
    mc.add_engine(engine)
    assert mc.type_options == type_options


def test_MC_type_options_interval(engine):
    target_type = datetime.Interval(precision=3, fields='SECOND')
    mc = MathesarColumn('testable_col', target_type)
    mc.add_engine(engine)
    assert mc.type_options == {'precision': 3, 'fields': 'SECOND'}


def get_mathesar_column_init_args():
    init_code = MathesarColumn.__init__.__code__
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
