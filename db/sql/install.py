import os
from db.connection import load_file_with_engine

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
MSAR_SQL = os.path.join(FILE_DIR, '0_msar.sql')


def install(engine):
    """Install SQL pieces using the given engine."""
    with open(MSAR_SQL) as file_handle:
        load_file_with_engine(engine, file_handle)
