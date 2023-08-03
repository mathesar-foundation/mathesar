from sqlalchemy import select, func
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import get_oid_from_table
from db.schemas.utils import get_schema_oid_from_name


def test_table_creation_doesnt_reuse_defaults(engine_with_schema):
    column_list = []
    engine, schema = engine_with_schema
    schema_oid = get_schema_oid_from_name(schema, engine)
    t1 = create_mathesar_table(engine, "t1", schema_oid, column_list)
    t2 = create_mathesar_table(engine, "t2", schema_oid, column_list)
    assert all(
        [
            c1.name == c2.name and c1 != c2
            for c1, c2 in zip(t1.columns, t2.columns)
        ]
    )


def test_table_creation_adds_comment(engine_with_schema):
    engine, schema = engine_with_schema
    column_list = []
    expect_comment = 'mytable comment goes here!!'
    schema_oid = get_schema_oid_from_name(schema, engine)
    table = create_mathesar_table(
        engine, 'mytable', schema_oid, column_list, comment=expect_comment,
    )
    table_oid = get_oid_from_table(table.name, schema, engine)
    with engine.begin() as conn:
        res = conn.execute(select(func.obj_description(table_oid, 'pg_class')))
    actual_comment = res.fetchone()[0]

    assert actual_comment == expect_comment
