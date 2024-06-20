from mathesar.models.deprecated import Column
from mathesar.models.base import ColumnMetaData


# This should be replaced once we have the ColumnMetadata model sorted out.
def get_raw_display_options(database_id, table_oid, attnums, user):
    """Get display options for the columns from Django."""
    if user.metadata_privileges(database_id) is not None:
        return [
            {"id": c.attnum} | c.display_options
            for c in Column.current_objects.filter(
                table__schema__database__id=database_id,
                table__oid=table_oid,
                attnum__in=attnums
            )
            if c.display_options is not None
        ]


def get_columns_meta_data(table_oid, database_id):
    return ColumnMetaData.filter(database__id=database_id, table_oid=table_oid)
