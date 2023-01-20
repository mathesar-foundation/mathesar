import bz2
import os

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from db.engine import create_future_engine

from demo.arxiv_skeleton import setup_and_register_schema_for_receiving_arxiv_data
from mathesar.models.base import Table, Schema, PreviewColumnSettings

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
LIBRARY_ONE = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_TWO = os.path.join(RESOURCES, "library_add_checkouts.sql")
DEVCON_DATASET = os.path.join(RESOURCES, "devcon_dataset.sql")
MOVIES_SQL_BZ2 = os.path.join(RESOURCES, "movie_collection.sql.bz2")

LIBRARY_MANAGEMENT = 'Library Management'
MATHESAR_CON = 'Mathesar Con'
MOVIE_COLLECTION = 'Movie Collection'
ARXIV = 'Latest Papers from arXiv'
MOVIES_SQL_BZ2 = os.path.join(RESOURCES, "movie_collection.sql.bz2")


def load_datasets(engine):
    """Load some SQL files with demo data to DB targeted by `engine`."""
    _load_library_dataset(engine)
    _load_movies_dataset(engine)
    _load_devcon_dataset(engine)
    _load_arxiv_data_skeleton(engine)


def _load_library_dataset(engine):
    """
    Load the library dataset into a "Library Management" schema.

    Uses given engine to define database to load into.
    Destructive, and will knock out any previous "Library Management"
    schema in the given database.
    """
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{LIBRARY_MANAGEMENT}" CASCADE;""")
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


def _load_devcon_dataset(engine):
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{MATHESAR_CON}" CASCADE;""")
    create_schema_query = text(f"""CREATE SCHEMA "{MATHESAR_CON}";""")
    set_search_path = text(f"""SET search_path="{MATHESAR_CON}";""")
    with engine.begin() as conn, open(DEVCON_DATASET) as f:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f.read()))


def _load_arxiv_data_skeleton(engine):
    setup_and_register_schema_for_receiving_arxiv_data(engine, schema_name=ARXIV)


def customize_settings(engine):
    """Set preview settings so demo data looks good."""
    _customize_library_preview_settings(engine)
    _customize_devcon_preview_settings(engine)


def _customize_library_preview_settings(engine):
    schema = _get_dj_schema_by_name(engine, LIBRARY_MANAGEMENT)
    authors = _get_dj_table_by_name(schema, 'Authors')
    _set_first_and_last_names_preview(authors)
    patrons = _get_dj_table_by_name(schema, 'Patrons')
    _set_first_and_last_names_preview(patrons)


def _customize_devcon_preview_settings(engine):
    schema = _get_dj_schema_by_name(engine, MATHESAR_CON)
    presenters = _get_dj_table_by_name(schema, 'Presenters')
    _set_first_and_last_names_preview(presenters)


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
