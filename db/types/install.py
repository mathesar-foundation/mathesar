from db.types import base, email, multicurrency, uri
from db.schemas.operations.create import create_schema
from db.types.operations.cast import install_all_casts


def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)


def install_mathesar_on_database(engine):
    create_type_schema(engine)
    email.install(engine)
    multicurrency.install(engine)
    uri.install(engine)
    uri.install_tld_lookup_table(engine)
    install_all_casts(engine)
