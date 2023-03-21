import psycopg


def execute_msar_func_with_engine(engine, func_name, *args):
    """
    Execute an msar function using an SQLAlchemy engine.

    This is temporary scaffolding.

    Args:
        engine: and SQLAlchemy engine for connecting to a DB
        func_name: The unqualified msar function name (danger; not sanitized)
        *args: The list of parameters to pass
    """
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        # Returns a cursor
        return conn.execute(
            f"SELECT msar.{func_name}({','.join(['%s']*len(args))})",
            args
        )
