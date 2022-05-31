import tempfile

from psycopg2 import sql

from db.encoding_utils import get_sql_compatible_encoding
from db.records.operations.select import get_record

READ_SIZE = 20000


def insert_record_or_records(table, engine, record_data):
    """
    record_data can be a dictionary, tuple, or list of dictionaries or tuples.
    if record_data is a list, it creates multiple records.
    """
    id_value = None
    with engine.begin() as connection:
        result = connection.execute(table.insert(), record_data)
        # If there was only a single record created, return the record.
        if result.rowcount == 1:
            # We need to manually commit insertion so that we can retrieve the record.
            connection.commit()
            id_value = result.inserted_primary_key[0]
            if id_value is not None:
                return get_record(table, engine, id_value)
    # Do not return any records if multiple rows were added.
    return None


def insert_records_from_csv(table, engine, csv_filepath, column_names, header, delimiter=None, escape=None, quote=None, encoding=None):
    with open(csv_filepath, "r", encoding=encoding) as csv_file:
        with engine.begin() as conn:
            cursor = conn.connection.cursor()
            # We should convert our entire query to sql.SQL class in order to keep its original header's name
            # When we call sql.Indentifier which will return a Identifier class (based on sql.Composable)
            # instead of a String. So we have to convert our punctuations to sql.Composable using sql.SQL
            relation = sql.SQL(".").join(
                sql.Identifier(part) for part in (table.schema, table.name)
            )
            formatted_columns = sql.SQL(",").join(
                sql.Identifier(column_name) for column_name in column_names
            )
            conversion_encoding, sql_encoding = get_sql_compatible_encoding(encoding)
            copy_sql = sql.SQL(
                "COPY {relation} ({formatted_columns}) FROM STDIN CSV {header} {delimiter} {escape} {quote} {encoding}"
            ).format(
                relation=relation,
                formatted_columns=formatted_columns,
                # If HEADER is not None, we'll pass its value to our entire SQL query
                header=sql.SQL("HEADER" if header else ""),
                # If DELIMITER is not None, we'll pass its value to our entire SQL query
                delimiter=sql.SQL(f"DELIMITER E'{delimiter}'" if delimiter else ""),
                # If ESCAPE is not None, we'll pass its value to our entire SQL query
                escape=sql.SQL(f"ESCAPE '{escape}'" if escape else ""),
                quote=sql.SQL(
                    ("QUOTE ''''" if quote == "'" else f"QUOTE '{quote}'")
                    if quote
                    else ""
                ),
                encoding=sql.SQL(f"ENCODING '{sql_encoding}'" if sql_encoding else ""),
            )
            if conversion_encoding == encoding:
                cursor.copy_expert(copy_sql, csv_file)
            else:
                # File needs to be converted to compatible database supported encoding
                with tempfile.SpooledTemporaryFile(mode='wb+', encoding=conversion_encoding) as temp_file:
                    while True:
                        # TODO: Raise an exception instead of silently replacing the characters
                        contents = csv_file.read(READ_SIZE).encode(conversion_encoding, "replace")
                        if not contents:
                            break
                        temp_file.write(contents)
                    temp_file.seek(0)
                    cursor.copy_expert(copy_sql, temp_file)
