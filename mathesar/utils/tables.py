from mathesar.models.base import Database, TableMetaData


def list_tables_meta_data(database_id):
    return TableMetaData.objects.filter(database__id=database_id)


def get_table_meta_data(table_oid, database_id):
    try:
        return TableMetaData.objects.get(
            table_oid=table_oid,
            database__id=database_id
        )
    except TableMetaData.DoesNotExist:
        return set_table_meta_data(
            table_oid=table_oid,
            metadata={},
            database_id=database_id
        )


def set_table_meta_data(table_oid, metadata, database_id):
    return TableMetaData.objects.update_or_create(
        database=Database.objects.get(id=database_id),
        table_oid=table_oid,
        defaults=metadata,
    )[0]
