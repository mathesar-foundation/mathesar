from db.types import base, email
from db.schemas import create_schema


def install_mathesar_on_database(engine):
    create_type_schema(engine)
    email.create_email_type(engine)


def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)
