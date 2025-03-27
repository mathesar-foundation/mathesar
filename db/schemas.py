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


def drop_schemas(conn, sch_oids):
    db_conn.exec_msar_func(conn, 'drop_schemas', sch_oids)


def schema_has_custom_type_dependency(sch_oid, conn):
    """
    Determine whether any column within the specified schema uses a custom type
    from the 'mathesar_types' namespace.
    """
    return db_conn.exec_msar_func(
        conn,
        'schema_has_custom_type_dependency',
        sch_oid
    ).fetchone()[0]
