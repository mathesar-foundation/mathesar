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
        metadata.TableMetaData(
            id=1, database_id=database_id, table_oid=1234,
            import_verified=True, column_order=[8, 9, 10], record_summary_customized=False,
            record_summary_template="{5555}"
        ),
        metadata.TableMetaData(
            id=2, database_id=database_id, table_oid=4567,
            import_verified=False, column_order=[], record_summary_customized=True,
            record_summary_template="{5512} {1223}"
        )
    ]
    actual_metadata_list = metadata.list_(database_id=database_id)
    assert actual_metadata_list == expect_metadata_list


def test_tables_meta_data_patch(monkeypatch):
    database_id = 2
    metadata_dict = {'import_verified': True, 'column_order': [1, 4, 12]}

    def mock_patch_tables_meta_data(table_oid, metadata_dict, _database_id):
        server_model = Server(id=2, host='example.com', port=5432)
        db_model = Database(id=_database_id, name='mymathesardb', server=server_model)
        return TableMetaData(
            id=1, database=db_model, table_oid=1234,
            import_verified=True, column_order=[1, 4, 12], record_summary_customized=False,
            record_summary_template="{5555}"
        )
    monkeypatch.setattr(metadata, "patch_table_meta_data", mock_patch_tables_meta_data)

    expect_metadata_object = metadata.TableMetaData(
        id=1, database_id=database_id, table_oid=1234,
        import_verified=True, column_order=[1, 4, 12], record_summary_customized=False,
        record_summary_template="{5555}"
    )
    actual_metadata_object = metadata.patch(table_oid=1234, metadata_dict=metadata_dict, database_id=2)
    assert actual_metadata_object == expect_metadata_object
