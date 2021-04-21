from db.types import base
from db.schemas import create_schema


def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)
