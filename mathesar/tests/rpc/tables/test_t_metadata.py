"""
This file tests the table metadata RPC functions.

Fixtures:
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from mathesar.models.base import TableMetaData, Database, Server
from mathesar.rpc.tables import metadata


def test_tables_meta_data_list(monkeypatch):
    database_id = 2

    def mock_get_tables_meta_data(_database_id):
        server_model = Server(id=2, host='example.com', port=5432)
        db_model = Database(id=_database_id, name='mymathesardb', server=server_model)
        return [
            TableMetaData(
                id=1, database=db_model, table_oid=1234,
                import_verified=True, column_order=[8, 9, 10], record_summary_customized=False,
                record_summary_template="{5555}"
            ),
            TableMetaData(
                id=2, database=db_model, table_oid=4567,
                import_verified=False, column_order=[], record_summary_customized=True,
                record_summary_template="{5512} {1223}"
            )
        ]
    monkeypatch.setattr(metadata, "get_tables_meta_data", mock_get_tables_meta_data)

    expect_metadata_list = [
        metadata.TableMetaDataRecord(
            id=1, database_id=database_id, table_oid=1234,
            import_verified=True, column_order=[8, 9, 10], record_summary_customized=False,
            record_summary_template="{5555}"
        ),
        metadata.TableMetaDataRecord(
            id=2, database_id=database_id, table_oid=4567,
            import_verified=False, column_order=[], record_summary_customized=True,
            record_summary_template="{5512} {1223}"
        )
    ]
    actual_metadata_list = metadata.list_(database_id=database_id)
    assert actual_metadata_list == expect_metadata_list
