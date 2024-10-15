import os
from db.connection import load_file_with_conn
from db.types.custom import uri

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
MSAR_SQL = os.path.join(FILE_DIR, '00_msar.sql')
MSAR_JOIN_SQL = os.path.join(FILE_DIR, '10_msar_joinable_tables.sql')
MSAR_AGGREGATE_SQL = os.path.join(FILE_DIR, '30_msar_custom_aggregates.sql')
MSAR_TYPES = os.path.join(FILE_DIR, '40_msar_types.sql')
MSAR_PERMS = os.path.join(FILE_DIR, '50_msar_permissions.sql')


def install(conn):
    """Install SQL pieces using the given conn."""
    with open(MSAR_SQL) as file_handle:
        load_file_with_conn(conn, file_handle)
    with open(MSAR_JOIN_SQL) as file_handle:
        load_file_with_conn(conn, file_handle)
    with open(MSAR_AGGREGATE_SQL) as custom_aggregates:
        load_file_with_conn(conn, custom_aggregates)
    with open(MSAR_TYPES) as file_handle:
        load_file_with_conn(conn, file_handle)
    uri.install_tld_lookup_table(conn)
    with open(MSAR_PERMS) as file_handle:
        load_file_with_conn(conn, file_handle)
