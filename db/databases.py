from psycopg import sql
from config.database_config import get_internal_database_config
from db import connection as db_conn


def get_database(conn):
    return db_conn.exec_msar_func(conn, 'get_current_database_info').fetchone()[0]


def drop_database(database_oid, conn):
    icfg = get_internal_database_config()
    conn.commit()
    conn.autocommit = True

    with conn.cursor() as c:
        c.execute("SELECT datname FROM pg_database WHERE oid = %s", (database_oid,))
        dbname = c.fetchone()
        if not dbname:
            raise ValueError("Database OID not found")
        c.execute(sql.SQL("ALTER DATABASE {} OWNER TO {}")
                  .format(sql.Identifier(dbname[0]), sql.Identifier(icfg.role)))

    with db_conn.mathesar_connection(
        host=icfg.host, port=icfg.port, dbname=icfg.dbname,
        user=icfg.role, password=icfg.password, sslmode=icfg.sslmode,
        application_name='db.databases.drop_database',
    ) as c2:
        # Set autocommit immediately after connection
        c2.autocommit = True
        with c2.cursor() as cur:
            cur.execute(
                sql.SQL("""
                    SELECT pg_terminate_backend(pg_stat_activity.pid)
                    FROM pg_stat_activity
                    WHERE pg_stat_activity.datname = %s
                    AND pid <> pg_backend_pid()
                """),
                (dbname[0],)
            )
            cur.execute(sql.SQL("DROP DATABASE {}").format(sql.Identifier(dbname[0])))


def create_database(database_name, conn):
    conn.commit()
    conn.autocommit = True
    with conn.cursor() as c:
        c.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(database_name)))
