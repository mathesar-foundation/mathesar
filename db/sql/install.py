import os
import psycopg
from db.connection import load_file_with_engine

MSAR_SQL = os.path.abspath('0_msar.sql')


def install(engine):
    """Install SQL pieces using the given engine."""
    with open(MSAR_SQL) as file_handle:
        load_file_with_engine(engine, file_handle)
