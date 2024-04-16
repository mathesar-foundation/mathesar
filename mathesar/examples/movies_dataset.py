"""This module contains functions to load the Movie Collection dataset."""
import os
from sqlalchemy import text

from mathesar.examples.base import (
    MOVIE_COLLECTION, MOVIES_SQL_TABLES, MOVIES_CSV, MOVIES_SQL_FKS
)


def load_movies_dataset(engine, safe_mode=False):
    """
    Load the movie example data set.

    Args:
        engine: an SQLAlchemy engine defining the connection to load data into.
        safe_mode: When True, we will throw an error if the "Movie Collection"
                   schema already exists instead of dropping it.
    """
    drop_schema_query = text(f"""DROP SCHEMA IF EXISTS "{MOVIE_COLLECTION}" CASCADE;""")
    with engine.begin() as conn, open(MOVIES_SQL_TABLES) as f, open(MOVIES_SQL_FKS) as f2:
        if safe_mode is False:
            conn.execute(drop_schema_query)
        conn.execute(text(f.read()))
        for file in os.scandir(MOVIES_CSV):
            table_name = file.name.split('.csv')[0]
            with open(file, 'r') as csv_file:
                conn.connection.cursor().copy_expert(
                    f"""COPY "{MOVIE_COLLECTION}"."{table_name}" FROM STDIN DELIMITER ',' CSV HEADER""",
                    csv_file
                )
        conn.execute(text(f2.read()))
