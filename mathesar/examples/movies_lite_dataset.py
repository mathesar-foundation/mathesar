from mathesar.examples.base import load_dataset_sql

MOVIES_SCHEMA = "Movie Rentals"
MOVIES_SQL = "movie_rentals_lite.sql"


def load_movie_rentals_dataset(conn):
    "Load the movie rentals dataset"
    load_dataset_sql(conn, MOVIES_SCHEMA, MOVIES_SQL)
