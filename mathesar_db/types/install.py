from mathesar_db.types import base
from mathesar_db.schemas import create_schema


def create_type_schema(engine):
    create_schema(base.SCHEMA, engine)
