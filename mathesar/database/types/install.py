from sqlalchemy import text
from mathesar.database.types import constants as c
from mathesar.database.schemas import create_schema

def create_type_schema(engine):
    create_schema(c.TYPE_SCHEMA, engine=engine)
