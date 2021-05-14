from db.types import base, casts, email
from db.schemas import create_schema


def install_mathesar_on_database(engine):
    create_type_schema(engine)
    email.create_email_type(engine)
    casts.install_all_casts(engine)



def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)
