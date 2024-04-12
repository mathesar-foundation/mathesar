"""This module contains functions to load datasets for demo purposes."""
import logging
import pickle

from sqlalchemy import text

from demo.install.library_dataset import load_library_dataset
from demo.install.movies_dataset import load_movies_dataset
from demo.install.base import (MATHESAR_CON, DEVCON_DATASET,)


def load_datasets(engine):
    """Load some SQL files with demo data to DB targeted by `engine`."""
    load_library_dataset(engine)
    load_movies_dataset(engine)
    _load_devcon_dataset(engine)


def _load_devcon_dataset(engine):
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{MATHESAR_CON}" CASCADE;""")
    create_schema_query = text(f"""CREATE SCHEMA "{MATHESAR_CON}";""")
    set_search_path = text(f"""SET search_path="{MATHESAR_CON}";""")
    with engine.begin() as conn, open(DEVCON_DATASET) as f:
        conn.execute(drop_schema_query)
        conn.execute(create_schema_query)
        conn.execute(set_search_path)
        conn.execute(text(f.read()))
