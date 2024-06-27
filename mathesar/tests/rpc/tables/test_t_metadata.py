"""
This file tests the table metadata RPC functions.

Fixtures:
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
"""
from mathesar.models.base import TableMetaData, Database, Server
from mathesar.rpc.tables import metadata


def test_tables_meta_data_list(monkeypatch):
    database_id = 2
    schema_oid = 123456

    def mock_get_tables_meta_data(_schema_oid, _database_id):
        server_model = Server(id=2, host='example.com', port=5432)
        db_model = Database(id=_database_id, name='mymathesardb', server=server_model)
        return [
            TableMetaData(
                database=db_model, schema_oid=_schema_oid, table_oid=1234,
                import_verified=True, column_order=[8, 9, 10], preview_customized=False,
                preview_template="{5555}"
            ),
            TableMetaData(
                database=db_model, schema_oid=_schema_oid, table_oid=4567,
                import_verified=False, column_order=[], preview_customized=True,
                preview_template="{5512} {1223}"
            )
        ]
    monkeypatch.setattr(metadata, "get_tables_meta_data", mock_get_tables_meta_data)

    expect_metadata_list = [
        metadata.TableMetaData(
            database_id=database_id, schema_oid=schema_oid, table_oid=1234,
            import_verified=True, column_order=[8, 9, 10], preview_customized=False,
            preview_template="{5555}"
        ),
        metadata.TableMetaData(
            database_id=database_id, schema_oid=schema_oid, table_oid=4567,
            import_verified=False, column_order=[], preview_customized=True,
            preview_template="{5512} {1223}"
        )
    ]
    actual_metadata_list = metadata.list_(schema_oid=schema_oid, database_id=database_id)
    assert actual_metadata_list == expect_metadata_list
