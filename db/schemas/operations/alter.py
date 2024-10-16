import json

from db.connection import exec_msar_func


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
    return exec_msar_func(conn, "patch_schema", schema_oid, json.dumps(patch)).fetchone()[0]
