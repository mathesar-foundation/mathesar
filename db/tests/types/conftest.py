import pytest
from sqlalchemy import MetaData, Table
from db.tables.operations.select import get_oid_from_table
from db.types.base import MathesarCustomType
from db.columns.operations.alter import alter_column_type
from db.columns.operations.select import get_column_attnum_from_name


@pytest.fixture
def roster_table_obj(engine_with_roster, roster_table_name):
    engine, schema = engine_with_roster
    metadata = MetaData(bind=engine)
    table = Table(roster_table_name, metadata, schema=schema, autoload_with=engine)
    # Cast "Teacher Email" column from string to Email
    with engine.begin() as conn:
        email_column_name = "Teacher Email"
        email_type = MathesarCustomType.EMAIL
        table_oid = get_oid_from_table(table.name, schema, engine)
        email_column_attnum = get_column_attnum_from_name(
            table_oid, email_column_name, engine, metadata
        )
        alter_column_type(
            table_oid,
            email_column_attnum,
            engine,
            conn,
            email_type,
        )
    yield table, engine
