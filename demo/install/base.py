"""The demo.install namespace contains logic for setting up new demo instances."""
import os

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db.engine import create_future_engine

from mathesar.models.base import Table, Schema

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
LIBRARY_ONE = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_TWO = os.path.join(RESOURCES, "library_add_checkouts.sql")
LIBRARY_MANAGEMENT = 'Library Management'
MOVIE_COLLECTION = 'Movie Collection'
ARXIV = 'Latest Papers from arXiv'
MOVIES_SQL_BZ2 = os.path.join(RESOURCES, "movie_collection.sql.bz2")


def get_dj_schema_by_name(engine, name):
    """Find a schema with a given name in the given DB."""
    db_name = engine.url.database
    schemas = Schema.objects.filter(database__name=db_name)
    for s in schemas:
        if s.name == name:
            return s


def get_dj_table_by_name(schema, name):
    """Find a table with a given name in the given schema."""
    tables = Table.objects.filter(schema=schema)
    for t in tables:
        if t.name == name:
            return t


def get_dj_column_by_name(table, name):
    """Find a column with a given name in the given table."""
    columns = table.columns.all()
    for c in columns:
        if c.name == name:
            return c


def create_demo_database(
        user_db, username, password, hostname, root_db, port, template_db
):
    """Create database, install Mathesar on it, add demo data."""
    user_db_engine = create_future_engine(
        username, password, hostname, user_db, port
    )
    try:
        user_db_engine.connect()
        user_db_engine.dispose()
        print(f"Database {user_db} already exists! Skipping...")
    except OperationalError:
        root_db_engine = create_future_engine(
            username, password, hostname, root_db, port,
        )
        with root_db_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f"CREATE DATABASE {user_db} TEMPLATE {template_db};"))
        root_db_engine.dispose()
        user_db_engine.dispose()
        print(f"Created DB is {user_db}.")
