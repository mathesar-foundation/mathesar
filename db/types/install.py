from db.types import base, email
from db.schemas.operations.create import create_schema
from db.types.operations.cast import install_all_casts


def install_mathesar_on_database(engine):
    create_type_schema(engine)
    email.install(engine)
    install_all_casts(engine)


def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)
