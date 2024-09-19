from db.connection import execute_msar_func_with_engine, exec_msar_func


def create_schema_via_sql_alchemy(schema_name, engine, description=None):
    """
    Creates a schema using a SQLAlchemy engine.

    Args:
        schema_name: Name of the schema to create.
        engine: SQLAlchemy engine object for connecting.
        description: A new description to set on the schema.

    If a schema already exists with the given name, this function will raise an error.

    Returns:
        The integer oid of the newly created schema.
    """
    return execute_msar_func_with_engine(
        engine, 'create_schema', schema_name, description
    ).fetchone()[0]


def create_schema_if_not_exists_via_sql_alchemy(schema_name, engine):
    """
    Ensure that a schema exists using a SQLAlchemy engine.

    Args:
        schema_name: Name of the schema to create.
        engine: SQLAlchemy engine object for connecting.

    Returns:
        The integer oid of the newly created schema.
    """
    return execute_msar_func_with_engine(
        engine, 'create_schema_if_not_exists', schema_name
    ).fetchone()[0]


def create_schema(schema_name, conn, description=None):
    """
    Create a schema using a psycopg connection.

    Args:
        schema_name: Name of the schema to create.
        conn: a psycopg connection
        description: A new description to set on the schema.

    If a schema already exists with the given name, this function will raise an error.

    Returns:
        The SchemaInfo describing the user-defined schema in the database.
    """
    return exec_msar_func(conn, 'create_schema', schema_name, description).fetchone()[0]
