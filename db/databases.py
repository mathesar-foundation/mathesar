from psycopg import sql
from config.database_config import get_internal_database_config
from db import connection as db_conn
from mathesar.rpc.exceptions.handlers import MathesarException


def get_database(conn):
    return db_conn.exec_msar_func(conn, 'get_current_database_info').fetchone()[0]


def drop_database(database_oid, conn):
    icfg = get_internal_database_config()
    with conn.cursor() as c:
        conn.autocommit = True
        c.execute("SELECT datname FROM pg_database WHERE oid = %s", (database_oid,))
        dbname = c.fetchone()
        if not dbname:
            raise MathesarException("Database OID not found")
        c.execute(sql.SQL("ALTER DATABASE {} OWNER TO {}")
            .format(sql.Identifier(dbname[0]), sql.Identifier(icfg.role)))
    # Do not close conn here; let context manager handle it
    with db_conn.mathesar_connection(
        host=icfg.host, port=icfg.port, dbname=icfg.dbname,
        user=icfg.role, password=icfg.password, sslmode=icfg.sslmode,
        application_name='db.databases.drop_database',
    ) as c2:
        c2.autocommit = True
        drop_query = db_conn.exec_msar_func(c2, 'drop_database_query', database_oid).fetchone()[0]
        with c2.cursor() as cur:
            cur.execute(sql.SQL(drop_query))


def create_database(database_name, conn):
    with conn.cursor() as c:
        c.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(database_name)))
