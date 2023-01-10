import bz2
import os
from datetime import timedelta

from django.conf import settings
from django.utils.timezone import now
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db import engine
from db.metadata import get_empty_metadata
from mathesar.models.base import Database
from mathesar.state.django import reflect_db_objects
from mathesar.models.base import Table, Schema, PreviewColumnSettings

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
LIBRARY_ONE = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_TWO = os.path.join(RESOURCES, "library_add_checkouts.sql")
LIBRARY_MANAGEMENT = 'Library Management'
MOVIE_COLLECTION = 'Movie Collection'
MOVIES_SQL_BZ2 = os.path.join(RESOURCES, "movie_collection.sql.bz2")


def load_datasets(engine):
    """Load some SQL files with demo data to DB targeted by `engine`."""
    _load_library_dataset(engine)
    _load_movies_dataset(engine)


def _load_library_dataset(engine):
    """
    Load the library dataset into a "Library Management" schema.

    Uses given engine to define database to load into.
    Destructive, and will knock out any previous "Library Management"
    schema in the given database.
    """
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{LIBRARY_MANAGEMENT}";""")
    create_schema_query = text(f"""CREATE SCHEMA "{LIBRARY_MANAGEMENT}";""")
    set_search_path = text(f"""SET search_path="{LIBRARY_MANAGEMENT}";""")
    with engine.begin() as conn, open(LIBRARY_ONE) as f1, open(LIBRARY_TWO) as f2:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f1.read()))
        conn.execute(text(f2.read()))


def _load_movies_dataset(engine):
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{MOVIE_COLLECTION}" CASCADE;""")
    create_schema_query = text(f"""CREATE SCHEMA "{MOVIE_COLLECTION}";""")
    set_search_path = text(f"""SET search_path="{MOVIE_COLLECTION}";""")
    with engine.begin() as conn, bz2.open(MOVIES_SQL_BZ2, 'rt') as f:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f.read()))


def customize_settings(engine):
    """Set preview settings so demo data looks good."""
    _customize_library_preview_settings(engine)


def _customize_library_preview_settings(engine):
    schema = _get_dj_schema_by_name(engine, LIBRARY_MANAGEMENT)
    authors = _get_dj_table_by_name(schema, 'Authors')
    _set_first_and_last_names_preview(authors)
    patrons = _get_dj_table_by_name(schema, 'Patrons')
    _set_first_and_last_names_preview(patrons)


def _set_first_and_last_names_preview(table):
    first_name = _get_dj_column_by_name(table, 'First Name')
    last_name = _get_dj_column_by_name(table, 'Last Name')
    template = f'{{{first_name.id}}} {{{last_name.id}}}'
    new_preview_settings = PreviewColumnSettings.objects.create(
        customized=True, template=template
    )
    table.settings.preview_settings = new_preview_settings
    table.settings.save()


def _get_dj_schema_by_name(engine, name):
    db_name = engine.url.database
    schemas = Schema.objects.filter(database__name=db_name)
    for s in schemas:
        if s.name == name:
            return s


def _get_dj_table_by_name(schema, name):
    tables = Table.objects.filter(schema=schema)
    for t in tables:
        if t.name == name:
            return t


def _get_dj_column_by_name(table, name):
    columns = table.columns.all()
    for c in columns:
        if c.name == name:
            return c


def drop_all_stale_databases():
    excluded_databases = ['mathesar', 'postgres', 'template0', 'template1']
    databases = Database.objects.filter(created_at__gt=now() - timedelta(days=5))
    for database in databases:
        if database.name not in excluded_databases and database.deleted is False:
            drop_mathesar_database(
                database,
                username=settings.DATABASES["default"]["USER"],
                password=settings.DATABASES["default"]["PASSWORD"],
                hostname=settings.DATABASES["default"]["HOST"],
                port=settings.DATABASES["default"]["PORT"]
            )
            reflect_db_objects(get_empty_metadata())
    reflect_db_objects(get_empty_metadata())


def drop_mathesar_database(
        user_database, username, password, hostname, port,
):
    user_db_engine = engine.create_future_engine(
        username, password, hostname, user_database.name, port
    )
    try:
        user_db_engine.connect()
        with user_db_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            conn.execute(text(f"DROP DATABASE {user_database.name}"))
    except OperationalError:
        user_db_engine.dispose()
    finally:
        # This database is not created using a config file,
        # so their objects can be safety delete
        # as won't be created again during reflection or when running install script
        user_database.delete()
