from sqlalchemy import text
from mathesar.database.types import constants as c

def create_type_schema(engine):
    query = f"""CREATE SCHEMA IF NOT EXISTS "{c.TYPE_SCHEMA}";"""
    with engine.connect() as conn:
        conn.execute(text(query))
        conn.commit()
