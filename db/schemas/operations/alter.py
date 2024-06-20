import json

from db.connection import execute_msar_func_with_engine, exec_msar_func


def patch_schema_via_sql_alchemy(schema_name, engine, patch):
    """
    Patch a schema using a SQLAlchemy engine.

    Args:
        schema_name: Name of the schema to change.
        engine: SQLAlchemy engine object for connecting.
        patch: A dict mapping the following fields to new values:
            - 'name' (optional): New name for the schema.
            - 'description' (optional): New description for the schema.
    """
    execute_msar_func_with_engine(engine, "patch_schema", schema_name, json.dumps(patch))


def patch_schema(schema_oid, conn, patch):
    """
    Patch a schema using a psycopg connection.

    Args:
        schema_oid: The OID of the schema to change.
        conn: a psycopg connection
        patch: A dict mapping the following fields to new values:
            - 'name' (optional): New name for the schema.
            - 'description' (optional): New description for the schema.
    """
    exec_msar_func(conn, "patch_schema", schema_oid, json.dumps(patch))
