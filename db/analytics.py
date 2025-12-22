from db import connection as db_conn

from db.sql import d3l

def get_object_counts(conn):
    return d3l.get_object_counts.run(conn).fetchone()[0]
