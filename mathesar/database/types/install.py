from sqlalchemy import text
from mathesar.database.types import constants as c

def create_type_schema(engine, type_schema=c.TYPE_SCHEMA):
    query = f"""CREATE SCHEMA IF NOT EXISTS "{type_schema}";"""
    with engine.connect() as conn:
        conn.execute(text(query))
        conn.commit()
