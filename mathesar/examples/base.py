"""Constants for use by the example dataset loaders."""
import os

FILE_DIR = os.path.abspath(os.path.dirname(__file__))
RESOURCES = os.path.join(FILE_DIR, "resources")
LIBRARY_ONE = os.path.join(RESOURCES, "library_without_checkouts.sql")
LIBRARY_TWO = os.path.join(RESOURCES, "library_add_checkouts.sql")
DEVCON_DATASET = os.path.join(RESOURCES, "devcon_dataset.sql")
MOVIES_SQL_TABLES = os.path.join(RESOURCES, "movie_collection_tables.sql")
MOVIES_SQL_FKS = os.path.join(RESOURCES, "movie_collection_fks.sql")
MOVIES_CSV = os.path.join(RESOURCES, 'movies_csv')
LIBRARY_MANAGEMENT = 'Library Management'
MOVIE_COLLECTION = 'Movie Collection'
MATHESAR_CON = 'Mathesar Con'
