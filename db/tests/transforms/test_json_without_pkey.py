from db.records.operations.select import get_records


def test_default_ordering(json_without_pkey_table_obj):
    table, engine = json_without_pkey_table_obj
    records = get_records(table, engine, fallback_to_default_ordering=True)
    assert len(records) == 2
