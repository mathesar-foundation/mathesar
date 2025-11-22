from mathesar.examples.base import load_dataset_sql

BIKE_SHOP_SCHEMA = "Bike Shop"
BIKE_SHOP_SQL = "load_bike_shop.sql"


def load_bike_shop_dataset(conn):
    """Load the bike shop dataset."""
    load_dataset_sql(conn, BIKE_SHOP_SCHEMA, BIKE_SHOP_SQL)
