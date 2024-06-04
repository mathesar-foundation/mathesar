from mathesar.models.base import Column


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
