from db.tables.operations.create import create_mathesar_table


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
