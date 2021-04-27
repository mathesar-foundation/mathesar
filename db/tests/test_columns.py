from sqlalchemy import String, Integer, Column
from db import columns


def test_MC_inits_with_name():
    name = "mycol"
    c = columns.MathesarColumn(name, String)
    assert c.name == name


def test_MC_inits_with_sa_type():
    sa_type = String
    c = columns.MathesarColumn("anycol", sa_type)
    actual_cls = c.type.__class__
    assert actual_cls == sa_type


def test_MC_inits_default_not_pk():
    c = columns.MathesarColumn("anycol", String)
    assert not c.primary_key


def test_MC_inits_with_pk_true():
    c = columns.MathesarColumn("anycol", String, primary_key=True)
    assert c.primary_key


def test_MC_inits_default_nullable():
    c = columns.MathesarColumn("a_col", String)
    assert c.nullable


def test_MC_inits_with_nullable_false():
    c = columns.MathesarColumn("a_col", String, nullable=False)
    assert not c.nullable


def test_MC_is_default_when_true():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        c = columns.MathesarColumn(
            default_col, dc_definition["type"], dc_definition["primary_key"]
        )
        assert c.is_default


def test_MC_is_default_when_false_for_name():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        c = columns.MathesarColumn(
            "definitely_not_a_default",
            dc_definition["type"],
            dc_definition["primary_key"]
        )
        assert not c.is_default


def test_MC_is_default_when_false_for_type():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        changed_type = Integer if dc_definition["type"] == String else String
        c = columns.MathesarColumn(
            default_col,
            changed_type,
            dc_definition["primary_key"]
        )
        assert not c.is_default


def test_MC_is_default_when_false_for_pk():
    for default_col in columns.DEFAULT_COLUMNS:
        dc_definition = columns.DEFAULT_COLUMNS[default_col]
        c = columns.MathesarColumn(
            default_col,
            dc_definition["type"],
            not dc_definition["primary_key"]
        )
        assert not c.is_default


def test_MC_from_column():
    orig_col = Column("testcol", String)
    new_col = columns.MathesarColumn.from_column(orig_col)
    assert new_col.name == orig_col.name and new_col.type == orig_col.type
