"""
This file tests the column metadata RPC functions.

Fixtures:
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from mathesar.models.base import ColumnMetaData, Database, Server
from mathesar.rpc.columns import metadata


# TODO consider mocking out ColumnMetaData queryset for this test
def test_columns_meta_data_list(monkeypatch):
    database_id = 2
    table_oid = 123456

    def mock_get_columns_meta_data(_table_oid, _database_id):
        server_model = Server(id=2, host='example.com', port=5432)
        db_model = Database(id=_database_id, name='mymathesardb', server=server_model)
        return [
            ColumnMetaData(
                database=db_model, table_oid=_table_oid, attnum=2,
                bool_input="dropdown", bool_true="TRUE", bool_false="FALSE",
                num_min_frac_digits=5, num_max_frac_digits=10, num_grouping="force-yes",
                mon_currency_symbol="EUR", mon_currency_location="end-with-space",
                time_format=None, date_format=None,
                duration_min=None, duration_max=None, num_format="english",
                display_width=None,
            ),
            ColumnMetaData(
                database=db_model, table_oid=_table_oid, attnum=8,
                bool_input="checkbox", bool_true="true", bool_false="false",
                num_min_frac_digits=2, num_max_frac_digits=8, num_grouping="force-no",
                mon_currency_symbol="$", mon_currency_location="after-minus",
                time_format=None, date_format=None,
                duration_min=None, duration_max=None, num_format="german",
                display_width=300,
            )
        ]

    monkeypatch.setattr(metadata, "get_columns_meta_data", mock_get_columns_meta_data)

    expect_metadata_list = [
        metadata.ColumnMetaDataRecord(
            database_id=database_id, table_oid=table_oid, attnum=2,
            bool_input="dropdown", bool_true="TRUE", bool_false="FALSE",
            num_min_frac_digits=5, num_max_frac_digits=10, num_grouping="force-yes",
            mon_currency_symbol="EUR", mon_currency_location="end-with-space",
            time_format=None, date_format=None,
            duration_min=None, duration_max=None, num_format="english",
            display_width=None,
        ),
        metadata.ColumnMetaDataRecord(
            database_id=database_id, table_oid=table_oid, attnum=8,
            bool_input="checkbox", bool_true="true", bool_false="false",
            num_min_frac_digits=2, num_max_frac_digits=8, num_grouping="force-no",
            mon_currency_symbol="$", mon_currency_location="after-minus",
            time_format=None, date_format=None,
            duration_min=None, duration_max=None, num_format="german",
            display_width=300,
        ),
    ]
    actual_metadata_list = metadata.list_(table_oid=table_oid, database_id=database_id)
    assert actual_metadata_list == expect_metadata_list
