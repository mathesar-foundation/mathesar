"""
This file tests the table metadata RPC functions.

Fixtures:
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from mathesar.models.base import TableMetaData, Database, Server, DataFile
from mathesar.rpc.tables import metadata


def test_tables_meta_data_list(monkeypatch):
    database_id = 2

    def mock_list_tables_meta_data(_database_id):
        server_model = Server(id=2, host="example.com", port=5432)
        db_model = Database(id=_database_id, name="mymathesardb", server=server_model)
        return [
            TableMetaData(
                id=1,
                database=db_model,
                table_oid=1234,
                data_file=None,
                import_verified=True,
                column_order=[8, 9, 10],
                record_summary_template=None,
            ),
            TableMetaData(
                id=2,
                database=db_model,
                table_oid=4567,
                data_file=DataFile(id=11),
                import_verified=False,
                column_order=[],
                record_summary_template=None,
            ),
        ]

    monkeypatch.setattr(metadata, "list_tables_meta_data", mock_list_tables_meta_data)

    expect_metadata_list = [
        metadata.TableMetaDataRecord(
            id=1,
            database_id=database_id,
            table_oid=1234,
            data_file_id=None,
            import_verified=True,
            column_order=[8, 9, 10],
            record_summary_template=None,
        ),
        metadata.TableMetaDataRecord(
            id=2,
            database_id=database_id,
            table_oid=4567,
            data_file_id=11,
            import_verified=False,
            column_order=[],
            record_summary_template=None,
        ),
    ]
    actual_metadata_list = metadata.list_(database_id=database_id)
    assert actual_metadata_list == expect_metadata_list
