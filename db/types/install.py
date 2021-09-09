from db.types import base, alteration, email
from db.schemas.operations.create import create_schema


def install_mathesar_on_database(engine):
    create_type_schema(engine)
    email.install(engine)
    alteration.install_all_casts(engine)


def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)
