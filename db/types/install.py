from db.constants import TYPES_SCHEMA
import psycopg


def uninstall_mathesar_from_database(engine):
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        # TODO: Clean up this code so that it references all the schemas in our
        # `INTERNAL_SCHEMAS` constant.
        conn.execute(f"DROP SCHEMA IF EXISTS __msar, msar, {TYPES_SCHEMA} CASCADE")
