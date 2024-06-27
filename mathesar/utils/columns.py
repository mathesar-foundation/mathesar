from mathesar.models.base import ColumnMetaData


def get_columns_meta_data(table_oid, database_id):
    return ColumnMetaData.filter(database__id=database_id, table_oid=table_oid)
