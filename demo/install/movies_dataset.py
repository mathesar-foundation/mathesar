"""This module contains functions to load the Movie Collection dataset."""
import bz2
import os
from sqlalchemy import text

from demo.install.base import MOVIE_COLLECTION, MOVIES_SQL, MOVIES_CSV, MOVIES_SQL2


def load_movies_dataset(engine, safe_mode=False):
    """
    Load the movie demo data set.

    Args:
        engine: an SQLAlchemy engine defining the connection to load data into.
        safe_mode: When True, we will throw an error if the "Movie Collection"
                   schema already exists instead of dropping it.
    """
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{MOVIE_COLLECTION}" CASCADE;""")
    # create_schema_query = text(f"""CREATE SCHEMA "{MOVIE_COLLECTION}";""")
    # set_search_path = text(f"""SET search_path="{MOVIE_COLLECTION}";""")
    with engine.begin() as conn, open(MOVIES_SQL) as f, open(MOVIES_SQL2) as f2:
        if safe_mode is False:
            conn.execute(drop_schema_query)
        # conn.execute(create_schema_query)
        # conn.execute(set_search_path)
        conn.execute(text(f.read()))
        for file in os.scandir(MOVIES_CSV):
            table_name = file.name.split('.csv')[0]
            with open(file, 'r') as csv:
                conn.connection.cursor().copy_expert(
                f"""COPY "{MOVIE_COLLECTION}"."{table_name}" FROM STDIN DELIMITER ',' CSV HEADER""",
                csv
                )
        conn.execute(text(f2.read()))
