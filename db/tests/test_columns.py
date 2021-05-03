import pytest
from sqlalchemy import String, Integer, Column
from db import columns


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
def test_MC_inits_default_not_pk(column_builder):
    col = column_builder("anycol", String)
    assert not col.primary_key


@pytest.mark.parametrize("column_builder", column_builder_list)
def test_MC_inits_with_pk_true(column_builder):
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


# def test_MC_from_column():
#     orig_col = Column("testcol", String)
#     new_col = columns.MathesarColumn.from_column(orig_col)
#     assert new_col.name == orig_col.name and new_col.type == orig_col.type
#
#
# def test_self_globals():
#     print("\n\n\n\n\n ")
#     global_dict = globals().copy()
#     for g in global_dict:
#         if g[:4] == "test":
#             print(g, global_dict[g])
#     print("\n\n\n\n\n")
