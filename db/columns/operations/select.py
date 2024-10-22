from db.connection import exec_msar_func


def get_column_info_for_table(table, conn):
    """
    Return a list of dictionaries describing the columns of the table.

    The `table` can be given as either a "qualified name", or an OID.
    The OID is the preferred identifier, since it's much more robust.

    The returned list contains dictionaries of the following form:

        {
            "id": <int>,
            "name": <str>,
            "type": <str>,
            "type_options": {
                "precision": <int>,
                "scale": <int>,
                "fields": <str>,
                "length": <int>,
                "item_type": <str>,
            },
            "nullable": <bool>,
            "primary_key": <bool>,
            "valid_target_types": [<str>, <str>, ..., <str>]
            "default": {"value": <str>, "is_dynamic": <bool>},
            "has_dependents": <bool>,
            "current_role_priv": [<str>, <str>, ...],
            "description": <str>
        }

    The fields of the "type_options" dictionary are all optional,
    depending on the "type" value.

    Args:
        table: The table for which we want column info.
    """
    return exec_msar_func(conn, 'get_column_info', table).fetchone()[0]
