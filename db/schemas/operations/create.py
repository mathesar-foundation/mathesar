from db.connection import exec_msar_func


def create_schema(schema_name, conn, owner_oid, description=None):
    """
    Create a schema using a psycopg connection.

    Args:
        schema_name: Name of the schema to create.
        conn: a psycopg connection
        owner_oid: The OID of the role who will own the new schema.(optional)
        description: A new description to set on the schema.(optional)

    If a schema already exists with the given name, this function will raise an error.

    Returns:
        The SchemaInfo describing the user-defined schema in the database.
    """
    return exec_msar_func(conn, 'create_schema', schema_name, owner_oid, description).fetchone()[0]
