import json

from db.connection import exec_msar_func


def add_foreign_key_column(
        conn,
        column_name,
        referrer_table_oid,
        referent_table_oid,
        unique_link=False
):
    """
    Creates a Many-to-One or One-to-One link.

    Args:
        conn: psycopg3 connection object.
        column_name: Name of the new column to be created in the referrer
                     table.
        referrer_table_oid: The OID of the referrer table.
        referent_table_oid: The OID of the referent table.
        unique_link: Whether to make the link one-to-one
                     instead of many-to-one.
    """
    exec_msar_func(
        conn,
        'add_foreign_key_column',
        column_name,
        referrer_table_oid,
        referent_table_oid,
        unique_link
    )


def add_mapping_table(
        conn,
        schema_oid,
        table_name,
        mapping_columns,
):
    """
    Add a mapping table to give a many-to-many link between referents.

    Args:
        conn: psycopg3 connection object.
        schema_oid: The OID of the schema for the mapping table.
        table_name: The name for the new mapping table.
        mapping_columns: A list of dictionaries giving the foreign key
                        columns to create in the mapping table.

    The elements of the mapping_columns list must have the form
        {"column_name": <str>, "referent_table_oid": <int>}
    """
    exec_msar_func(
        conn,
        'add_mapping_table',
        schema_oid,
        table_name,
        json.dumps(mapping_columns)
    )
