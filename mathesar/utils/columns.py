from mathesar.models.base import ColumnMetaData, Database


def get_columns_meta_data(table_oid, database_id):
    return ColumnMetaData.objects.filter(
        database__id=database_id, table_oid=table_oid
    )


def set_columns_meta_data(column_meta_data_list, table_oid, database_id):
    db_model = Database.objects.get(id=database_id)
    for meta_data_dict in column_meta_data_list:
        # TODO decide if this is worth the trouble of doing in bulk.
        ColumnMetaData.objects.update_or_create(
            database=db_model,
            table_oid=table_oid,
            attnum=meta_data_dict["attnum"],
            defaults=meta_data_dict
        )
    return get_columns_meta_data(table_oid, database_id)


def get_download_link_columns(table_oid, database_id):
    return [
        c.attnum for c in get_columns_meta_data(table_oid, database_id)
        if c.file_backend
    ]
