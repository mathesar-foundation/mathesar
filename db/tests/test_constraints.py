import pytest
from sqlalchemy import String, Integer, Column, Table, MetaData, PrimaryKeyConstraint, UniqueConstraint
from sqlalchemy.exc import ProgrammingError

from db import constraints
from db.tables import utils as table_utils


def _get_first_unique_constraint(table):
    constraint_list = list(table.constraints)
    for item in constraint_list:
        if type(item) == UniqueConstraint:
            return item


def _assert_only_primary_key_present(table):
    constraint_list = list(table.constraints)
    assert len(constraint_list) == 1
    assert type(constraint_list[0]) == PrimaryKeyConstraint


def _assert_primary_key_and_unique_present(table):
    constraint_list = list(table.constraints)
    assert len(constraint_list) == 2
    assert set([PrimaryKeyConstraint, UniqueConstraint]) == set([type(constraint) for constraint in table.constraints])


def test_create_single_column_unique_constraint(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "orders_1"
    unique_column_name = 'product_name'
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column('order_id', Integer, primary_key=True),
        Column(unique_column_name, String),
    )
    table.create()
    _assert_only_primary_key_present(table)
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)

    constraints.create_unique_constraint(table.name, schema, engine, [unique_column_name])
    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)

    unique_constraint = _get_first_unique_constraint(altered_table)
    assert unique_constraint.name == f'{table_name}_{unique_column_name}_key'
    assert len(list(unique_constraint.columns)) == 1
    assert list(unique_constraint.columns)[0].name == unique_column_name


def test_create_multiple_column_unique_constraint(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "orders_2"
    unique_column_names = ['product_name', 'customer_name']
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column('order_id', Integer, primary_key=True),
        Column(unique_column_names[0], String),
        Column(unique_column_names[1], String),
    )
    table.create()
    _assert_only_primary_key_present(table)
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)

    constraints.create_unique_constraint(table.name, schema, engine, unique_column_names)
    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)

    unique_constraint = _get_first_unique_constraint(altered_table)
    unique_column_name_1 = unique_column_names[0]
    assert unique_constraint.name == f'{table_name}_{unique_column_name_1}_key'
    assert len(list(unique_constraint.columns)) == 2
    assert set([column.name for column in unique_constraint.columns]) == set(unique_column_names)


def test_drop_unique_constraint(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "orders_3"
    unique_column_name = 'product_name'
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column('order_id', Integer, primary_key=True),
        Column(unique_column_name, String),
    )
    table.create()

    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    constraints.create_unique_constraint(table.name, schema, engine, [unique_column_name])
    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)
    unique_constraint = _get_first_unique_constraint(altered_table)

    constraints.drop_constraint(table_name, schema, engine, unique_constraint.name)
    new_altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    _assert_only_primary_key_present(new_altered_table)


def test_create_unique_constraint_with_custom_name(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "orders_4"
    unique_column_name = 'product_name'
    constraint_name = 'unique_product_name'
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column('order_id', Integer, primary_key=True),
        Column(unique_column_name, String),
    )
    table.create()
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    constraints.create_unique_constraint(table.name, schema, engine, [unique_column_name], constraint_name)

    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)

    unique_constraint = _get_first_unique_constraint(altered_table)
    assert unique_constraint.name == constraint_name
    assert len(list(unique_constraint.columns)) == 1
    assert list(unique_constraint.columns)[0].name == unique_column_name


def test_create_unique_constraint_with_duplicate_name(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "orders_4"
    unique_column_names = ['product_name', 'customer_name']
    constraint_name = 'unique_product_name'
    table = Table(
        table_name,
        MetaData(bind=engine, schema=schema),
        Column('order_id', Integer, primary_key=True),
        Column(unique_column_names[0], String),
        Column(unique_column_names[1], String),
    )
    table.create()
    table_oid = table_utils.get_oid_from_table(table_name, schema, engine)
    constraints.create_unique_constraint(table.name, schema, engine, [unique_column_names[0]], constraint_name)

    altered_table = table_utils.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)
    with pytest.raises(ProgrammingError):
        constraints.create_unique_constraint(table.name, schema, engine, [unique_column_names[1]], constraint_name)
