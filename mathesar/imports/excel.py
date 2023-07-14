import pandas

from db.tables.operations.alter import update_pk_sequence_to_latest
from mathesar.database.base import create_mathesar_engine
from db.records.operations.insert import insert_records_from_excel
from db.tables.operations.create import create_string_column_table
from db.tables.operations.drop import drop_table
from mathesar.imports.utils import process_column_names
from db.constants import ID, ID_ORIGINAL
from psycopg2.errors import IntegrityError, DataError

from mathesar.state import reset_reflection


def get_column_names_from_excel(data_file):
    df = pandas.read_excel(data_file)
    return list(df.columns)


def insert_data_from_excel_data_file(name, schema, column_names, engine, comment, excel_filepath):
    table = create_string_column_table(
        name=name,
        schema=schema.name,
        column_names=column_names,
        engine=engine,
        comment=comment,
    )

    insert_records_from_excel(
        table,
        engine,
        excel_filepath,
    )
    return table


def create_db_table_from_excel_data_file(data_file, name, schema, comment=None):
    db_name = schema.database.name
    engine = create_mathesar_engine(db_name)
    excel_filepath = data_file.file.path
    column_names = process_column_names(
        get_column_names_from_excel(excel_filepath)
    )
    try:
        table = insert_data_from_excel_data_file(name, schema, column_names, engine, comment, excel_filepath)
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = [
            fieldname if fieldname != ID else ID_ORIGINAL
            for fieldname in column_names
        ]
        table = insert_data_from_excel_data_file(name, schema, column_names_alt, engine, comment, excel_filepath)

    reset_reflection(db_name=db_name)
    return table
