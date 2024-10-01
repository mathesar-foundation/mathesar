import os
from db.connection import load_file_with_engine

FILE_DIR = os.path.abspath(os.path.dirname(__file__))

SQL_FILES = [
    '00_msar.sql',
    '10_msar_joinable_tables.sql',
    '30_msar_custom_aggregates.sql',
    '40_record_summaries.sql',
]


def _install_sql_file(engine, file_name):
    with open(os.path.join(FILE_DIR, file_name)) as file_handle:
        load_file_with_engine(engine, file_handle)


def install(engine):
    """Install SQL pieces using the given engine."""
    for file_name in SQL_FILES:
        _install_sql_file(engine, file_name)
