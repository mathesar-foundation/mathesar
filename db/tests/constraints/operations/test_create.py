import pytest
from sqlalchemy import String, Integer, Column, Table, MetaData
from sqlalchemy.exc import ProgrammingError

from db.columns.operations.select import get_column_attnum_from_name, get_columns_attnum_from_names
from db.constraints.base import UniqueConstraint
from db.constraints.operations.create import create_constraint, create_unique_constraint
from db.tables.operations.select import get_oid_from_table, reflect_table_from_oid
from db.tests.constraints import utils as test_utils


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
    test_utils.assert_only_primary_key_present(table)
    table_oid = get_oid_from_table(table_name, schema, engine)
    unique_column_attnum = get_column_attnum_from_name(table_oid, unique_column_name, engine)
    create_constraint(schema, engine, UniqueConstraint(None, table_oid, [unique_column_attnum]))
    altered_table = reflect_table_from_oid(table_oid, engine)
    test_utils.assert_primary_key_and_unique_present(altered_table)

    unique_constraint = test_utils.get_first_unique_constraint(altered_table)
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
    test_utils.assert_only_primary_key_present(table)
    table_oid = get_oid_from_table(table_name, schema, engine)
    unique_column_attnums = get_columns_attnum_from_names(table_oid, unique_column_names, engine)
    create_constraint(schema, engine, UniqueConstraint(None, table_oid, unique_column_attnums))
    altered_table = reflect_table_from_oid(table_oid, engine)
    test_utils.assert_primary_key_and_unique_present(altered_table)

    unique_constraint = test_utils.get_first_unique_constraint(altered_table)
    unique_column_name_1 = unique_column_names[0]
    assert unique_constraint.name == f'{table_name}_{unique_column_name_1}_key'
    assert len(list(unique_constraint.columns)) == 2
    assert set([column.name for column in unique_constraint.columns]) == set(unique_column_names)


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
    table_oid = get_oid_from_table(table_name, schema, engine)
    unique_column_attnum = get_column_attnum_from_name(table_oid, unique_column_name, engine)
    create_constraint(schema, engine, UniqueConstraint(constraint_name, table_oid, [unique_column_attnum]))

    altered_table = reflect_table_from_oid(table_oid, engine)
    test_utils.assert_primary_key_and_unique_present(altered_table)

    unique_constraint = test_utils.get_first_unique_constraint(altered_table)
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
    table_oid = get_oid_from_table(table_name, schema, engine)
    unique_column_attnum = get_column_attnum_from_name(table_oid, unique_column_names[0], engine)
    create_constraint(schema, engine, UniqueConstraint(constraint_name, table_oid, [unique_column_attnum]))

    altered_table = reflect_table_from_oid(table_oid, engine)
    test_utils.assert_primary_key_and_unique_present(altered_table)
    with pytest.raises(ProgrammingError):
        create_unique_constraint(table.name, schema, engine, [unique_column_names[1]], constraint_name)
