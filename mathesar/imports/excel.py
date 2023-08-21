import pandas

from db.constants import ID, ID_ORIGINAL
from db.tables.operations.alter import update_pk_sequence_to_latest
from mathesar.database.base import create_mathesar_engine
from db.records.operations.insert import insert_records_from_excel
from db.tables.operations.create import create_string_column_table
from db.tables.operations.drop import drop_table
from mathesar.imports.utils import get_alternate_column_names, process_column_names
from psycopg2.errors import IntegrityError, DataError
from sqlalchemy.exc import IntegrityError as sqlalchemy_integrity_error

from mathesar.state import reset_reflection


def insert_records_from_dataframe(name, schema, column_names, engine, comment, dataframe):
    table = create_string_column_table(
        name=name,
        schema_oid=schema.oid,
        column_names=column_names,
        engine=engine,
        comment=comment,
    )
    if ID_ORIGINAL in column_names:
        dataframe.rename(columns={ID: ID_ORIGINAL}, inplace=True)
    insert_records_from_excel(
        table,
        engine,
        dataframe,
    )
    return table


def create_db_table_from_excel_data_file(data_file, name, schema, comment=None):
    db_name = schema.database.name
    engine = create_mathesar_engine(db_name)
    dataframe = pandas.read_excel(data_file.file.path)
    column_names = process_column_names(dataframe.columns)
    try:
        table = insert_records_from_dataframe(name, schema, column_names, engine, comment, dataframe)
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError, sqlalchemy_integrity_error):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = get_alternate_column_names(column_names)
        table = insert_records_from_dataframe(name, schema, column_names_alt, engine, comment, dataframe)

    reset_reflection(db_name=db_name)
    return table
