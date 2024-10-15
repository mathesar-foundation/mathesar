"""This module contains functions to load the Movie Collection dataset."""
import os
from psycopg import sql

from mathesar.examples.base import (
    MOVIE_COLLECTION, MOVIES_SQL_TABLES, MOVIES_CSV, MOVIES_SQL_FKS
)


def load_movies_dataset(conn):
    """
    Load the movie example data set.

    Args:
        conn: a psycopg (3) connection for loading the data.

    Uses given connection to define database to load into. Raises an
    Exception if the "Movie Collection" schema already exists.
    """
    with open(MOVIES_SQL_TABLES) as f, open(MOVIES_SQL_FKS) as f2:
        conn.execute(f.read())
        for file in os.scandir(MOVIES_CSV):
            table_name = file.name.split('.csv')[0]
            copy_sql = sql.SQL(
                "COPY {}.{} FROM STDIN DELIMITER ',' CSV HEADER"
            ).format(
                sql.Identifier(MOVIE_COLLECTION), sql.Identifier(table_name)
            )
            with open(file, 'r') as csv, conn.cursor().copy(copy_sql) as copy:
                copy.write(csv.read())
        conn.execute(f2.read())
