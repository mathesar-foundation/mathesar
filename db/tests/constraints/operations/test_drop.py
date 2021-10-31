from sqlalchemy import String, Integer, Column, Table, MetaData

from db.constraints.operations.create import create_unique_constraint
from db.constraints.operations.drop import drop_constraint
from db.tables.operations.select import get_oid_from_table, reflect_table_from_oid
from db.tests.constraints import utils as test_utils


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

    table_oid = get_oid_from_table(table_name, schema, engine)
    create_unique_constraint(table.name, schema, engine, [unique_column_name])
    altered_table = reflect_table_from_oid(table_oid, engine)
    test_utils.assert_primary_key_and_unique_present(altered_table)
    unique_constraint = test_utils.get_first_unique_constraint(altered_table)

    drop_constraint(table_name, schema, engine, unique_constraint.name)
    new_altered_table = reflect_table_from_oid(table_oid, engine)
    test_utils.assert_only_primary_key_present(new_altered_table)
