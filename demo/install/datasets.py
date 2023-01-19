"""This module contains functions to load datasets for the demo."""
import bz2

from sqlalchemy import text

from demo.install.arxiv_skeleton import setup_and_register_schema_for_receiving_arxiv_data
from demo.install.base import (
    LIBRARY_MANAGEMENT, LIBRARY_ONE, LIBRARY_TWO,
    MOVIE_COLLECTION, MOVIES_SQL_BZ2,
    MATHESAR_CON, DEVCON_DATASET,
    ARXIV,
)


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
