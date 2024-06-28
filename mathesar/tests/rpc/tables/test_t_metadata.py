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
                id=1, database=db_model, schema_oid=_schema_oid, table_oid=1234,
                import_verified=True, column_order=[8, 9, 10], preview_customized=False,
                preview_template="{5555}"
            ),
            TableMetaData(
                id=2, database=db_model, schema_oid=_schema_oid, table_oid=4567,
                import_verified=False, column_order=[], preview_customized=True,
                preview_template="{5512} {1223}"
            )
        ]
    monkeypatch.setattr(metadata, "get_tables_meta_data", mock_get_tables_meta_data)

    expect_metadata_list = [
        metadata.TableMetaData(
            id=1, database_id=database_id, schema_oid=schema_oid, table_oid=1234,
            import_verified=True, column_order=[8, 9, 10], preview_customized=False,
            preview_template="{5555}"
        ),
        metadata.TableMetaData(
            id=2, database_id=database_id, schema_oid=schema_oid, table_oid=4567,
            import_verified=False, column_order=[], preview_customized=True,
            preview_template="{5512} {1223}"
        )
    ]
    actual_metadata_list = metadata.list_(schema_oid=schema_oid, database_id=database_id)
    assert actual_metadata_list == expect_metadata_list


def test_tables_meta_data_patch(monkeypatch):
    database_id = 2
    schema_oid = 123456
    metadata_dict = {'import_verified': True, 'column_order': [1, 4, 12]}

    def mock_patch_tables_meta_data(metadata_id, metadata_dict):
        server_model = Server(id=2, host='example.com', port=5432)
        db_model = Database(id=database_id, name='mymathesardb', server=server_model)
        return TableMetaData(
            id=1, database=db_model, schema_oid=schema_oid, table_oid=1234,
            import_verified=True, column_order=[1, 4, 12], preview_customized=False,
            preview_template="{5555}"
        )
    monkeypatch.setattr(metadata, "patch_table_meta_data", mock_patch_tables_meta_data)

    expect_metadata_object = metadata.TableMetaData(
        id=1, database_id=database_id, schema_oid=schema_oid, table_oid=1234,
        import_verified=True, column_order=[1, 4, 12], preview_customized=False,
        preview_template="{5555}"
    )
    actual_metadata_object = metadata.patch(metadata_id=1, metadata_dict=metadata_dict)
    assert actual_metadata_object == expect_metadata_object
