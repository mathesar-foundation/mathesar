from sqlalchemy import select, func
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import get_oid_from_table


def test_table_creation_doesnt_reuse_defaults(engine_with_schema):
    column_list = []
    engine, schema = engine_with_schema
    t1 = create_mathesar_table("t1", schema, column_list, engine)
    t2 = create_mathesar_table("t2", schema, column_list, engine)
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
    table = create_mathesar_table(
        'mytable', schema, column_list, engine, comment=expect_comment,
    )
    table_oid = get_oid_from_table(table.name, schema, engine)
    with engine.begin() as conn:
        res = conn.execute(select(func.obj_description(table_oid, 'pg_class')))
    actual_comment = res.fetchone()[0]

    assert actual_comment == expect_comment
