from mathesar.models.base import Column


# This should be replaced once we have the ColumnMetadata model sorted out.
def get_display_options(table_oid, attnums):
    return [
        {"id": c.attnum} | c.display_options
        for c in Column.current_objects.filter(
            table__oid=table_oid, attnum__in=attnums
        )
        if c.display_options is not None
    ]
