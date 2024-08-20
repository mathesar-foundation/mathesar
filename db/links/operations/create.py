import json

from db.connection import execute_msar_func_with_engine, exec_msar_func


def create_foreign_key_link(
        engine,
        referrer_column_name,
        referrer_table_oid,
        referent_table_oid,
        unique_link=False
):
    """
    Creates a Many-to-One or One-to-One link.

    Args:
        engine: SQLAlchemy engine object for connecting.
        referrer_column_name: Name of the new column to be created
                              in the referrer table.
        referrer_table_oid: The OID of the referrer table.
        referent_table_oid: The OID of the referent table.
        unique_link: Whether to make the link one-to-one
                     instead of many-to-one.

    Returns:
        Returns the attnum of the newly created column.
    """
    return execute_msar_func_with_engine(
        engine,
        'add_foreign_key_column',
        referrer_column_name,
        referrer_table_oid,
        referent_table_oid,
        unique_link
    ).fetchone()[0]


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


def create_many_to_many_link(engine, schema_oid, map_table_name, referents_dict):
    """
    Creates a Many-to-Many link.

    Args:
        engine: SQLAlchemy engine object for connecting.
        schema_oid: The OID of the schema in
                    which new referrer table is to be created.
        map_table_name: Name of the referrer table to be created.
        referents_dict: A python dict that contain 2 keys
                        'referent_table_oids' & 'column_names' with values as
                        ordered lists of table_oids & col_names respectively

    Returns:
        Returns the OID of the newly created table.
    """
    return execute_msar_func_with_engine(
        engine,
        'add_mapping_table',
        schema_oid,
        map_table_name,
        json.dumps(
            [
                {"column_name": c, "referent_table_oid": i}
                for c, i in zip(
                        referents_dict['column_names'],
                        referents_dict['referent_table_oids'],
                )
             ]
        )
    ).fetchone()[0]


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
        map_table_name,
        json.dumps(mapping_columns)
    )
