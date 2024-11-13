import json
from db import connection as db_conn


def list_schemas(conn):
    return db_conn.exec_msar_func(conn, 'list_schemas').fetchone()[0]


def get_schema(schema_oid, conn):
    return db_conn.exec_msar_func(conn, 'get_schema', schema_oid).fetchone()[0]


def patch_schema(schema_oid, conn, patch):
    """
    Patch a schema using a psycopg connection.

    Args:
        schema_oid: The OID of the schema to change.
        conn: a psycopg connection
        patch: A dict mapping the following fields to new values:
            - 'name' (optional): New name for the schema.
            - 'description' (optional): New description for the schema.

    Returns:
        The SchemaInfo describing the user-defined schema in the database.
    """
    return db_conn.exec_msar_func(conn, "patch_schema", schema_oid, json.dumps(patch)).fetchone()[0]


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
    return db_conn.exec_msar_func(conn, 'create_schema', schema_name, owner_oid, description).fetchone()[0]


def drop_schema_via_oid(conn, id, cascade=False):
    """
    Drop a schema by its OID.

    If no schema exists with the given oid, an exception will be raised.

    Args:
        conn: a psycopg connection
        id: the OID of the schema to drop.
        cascade: Whether to drop the dependent objects.
    """
    db_conn.exec_msar_func(conn, 'drop_schema', id, cascade).fetchone()
