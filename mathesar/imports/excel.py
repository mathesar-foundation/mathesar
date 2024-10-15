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


def remove_empty_rows_and_columns_from_dataframe(df):
    if df.iloc[0].isna().any():

        # drop rows with all NaN values
        df.dropna(how='all', inplace=True)

        # drop columns with all NaN values
        df.dropna(axis=1, how='all', inplace=True)

    if all(df.columns.str.startswith('Unnamed')):
        df.columns = df.iloc[0]
        df = df[1:]

    return df


def create_db_table_from_excel_data_file(data_file, name, schema, comment=None):
    db_model = schema.database
    engine = create_mathesar_engine(db_model)
    header_row = 0 if data_file.header else None
    dataframe = remove_empty_rows_and_columns_from_dataframe(
        pandas.read_excel(data_file.file.path, data_file.sheet_index, header=header_row)
    )
    column_names = process_column_names(dataframe.columns)
    try:
        table = insert_records_from_dataframe(name, schema, column_names, engine, comment, dataframe)
        update_pk_sequence_to_latest(engine, table)
    except (IntegrityError, DataError, sqlalchemy_integrity_error):
        drop_table(name=name, schema=schema.name, engine=engine)
        column_names_alt = get_alternate_column_names(column_names)
        table = insert_records_from_dataframe(name, schema, column_names_alt, engine, comment, dataframe)

    return table
