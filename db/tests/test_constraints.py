from sqlalchemy import String, Integer, Column, Table, MetaData, PrimaryKeyConstraint, UniqueConstraint

from db import constraints, tables


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
    table_oid = tables.get_oid_from_table(table_name, schema, engine)

    constraints.create_unique_constraint(table.name, schema, engine, [unique_column_name])
    altered_table = tables.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)

    unique_constraint = _get_first_unique_constraint(altered_table)
    assert unique_constraint.name == f'{table_name}_{unique_column_name}_key'
    assert len(list(unique_constraint.columns)) == 1
    assert list(unique_constraint.columns)[0].name == unique_column_name


def test_create_multiple_column_unique_constraint(engine_with_schema):
    engine, schema = engine_with_schema
    table_name = "orders_1"
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
    table_oid = tables.get_oid_from_table(table_name, schema, engine)

    constraints.create_unique_constraint(table.name, schema, engine, unique_column_names)
    altered_table = tables.reflect_table_from_oid(table_oid, engine)
    _assert_primary_key_and_unique_present(altered_table)

    unique_constraint = _get_first_unique_constraint(altered_table)
    unique_column_name_1 = unique_column_names[0]
    assert unique_constraint.name == f'{table_name}_{unique_column_name_1}_key'
    assert len(list(unique_constraint.columns)) == 2
    assert set([column.name for column in unique_constraint.columns]) == set(unique_column_names)
