from db.types.custom import email, money, multicurrency, uri, json_array, json_object
from db.constants import TYPES_SCHEMA
from db.schemas.operations.create import create_schema_if_not_exists_via_sql_alchemy
from db.types.operations.cast import install_all_casts
import psycopg


def create_type_schema(engine) -> None:
    create_schema_if_not_exists_via_sql_alchemy(TYPES_SCHEMA, engine)


def install_mathesar_on_database(engine):
    create_type_schema(engine)
    email.install(engine)
    money.install(engine)
    multicurrency.install(engine)
    uri.install(engine)
    uri.install_tld_lookup_table(engine)
    json_array.install(engine)
    json_object.install(engine)
    install_all_casts(engine)


def uninstall_mathesar_from_database(engine):
    conn_str = str(engine.url)
    with psycopg.connect(conn_str) as conn:
        # TODO: Clean up this code so that it references all the schemas in our
        # `INTERNAL_SCHEMAS` constant.
        conn.execute(f"DROP SCHEMA IF EXISTS __msar, msar, {TYPES_SCHEMA} CASCADE")
