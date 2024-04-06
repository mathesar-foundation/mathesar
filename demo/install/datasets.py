"""This module contains functions to load datasets for the demo."""
import logging
import pickle

from sqlalchemy import text

from demo.install.arxiv_skeleton import setup_and_register_schema_for_receiving_arxiv_data
from demo.install.library_dataset import load_library_dataset
from demo.install.movies_dataset import load_movies_dataset
from demo.management.commands.load_arxiv_data import update_arxiv_schema
from demo.install.base import (
    MATHESAR_CON, DEVCON_DATASET,
    ARXIV, ARXIV_PAPERS_PICKLE,
)


def load_datasets(engine):
    """Load some SQL files with demo data to DB targeted by `engine`."""
    load_library_dataset(engine)
    load_movies_dataset(engine)
    _load_devcon_dataset(engine)
    _load_arxiv_data_skeleton(engine)


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
    schema_name = ARXIV
    setup_and_register_schema_for_receiving_arxiv_data(engine, schema_name=schema_name)
    _load_arxiv_dataset(engine, schema_name=schema_name)


def _load_arxiv_dataset(engine, schema_name):
    """
    Defined separately, because this dataset does not need a dataset per-se; it's meant to be
    updated via cron. We're preloading some data so that it doesn't start off empty.

    Does not propogate if there's a failure.
    """
    try:
        with open(ARXIV_PAPERS_PICKLE, 'rb') as f:
            papers = pickle.load(f)
            update_arxiv_schema(engine, schema_name, papers)
    except Exception as e:
        logging.error(e, exc_info=True)
