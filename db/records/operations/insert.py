import json
import pandas
import tempfile

from psycopg2 import sql
from sqlalchemy.exc import IntegrityError, ProgrammingError
from psycopg2.errors import NotNullViolation, ForeignKeyViolation, DatatypeMismatch, UniqueViolation, ExclusionViolation
from db import connection as db_conn
from db.columns.exceptions import NotNullError, ForeignKeyError, TypeMismatchError, UniqueValueError, ExclusionError
from db.columns.base import MathesarColumn
from db.constants import ID, ID_ORIGINAL
from db.encoding_utils import get_sql_compatible_encoding
from db.records.operations.select import get_record
from sqlalchemy import select

READ_SIZE = 20000


def add_record_to_table(conn, record_def, table_oid, return_record_summaries=False):
    """Add a record to a table."""
    result = db_conn.exec_msar_func(
        conn,
        'add_record_to_table',
        table_oid,
        json.dumps(record_def),
        return_record_summaries
    ).fetchone()[0]
    return result


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


def get_records_from_dataframe(df):
    """
    We convert the dataframe to JSON using to_json() method and then to a Python object.
    This method replaces 'NaN' values in the dataframe with 'None' values in Python
    object. The reason behind not using df.to_dict() method is beacuse it stringifies
    'NaN' values rather than converting them to a 'None' value.
    We pass 'records' as the orientation parameter because we want each record to contain
    data of a single row and not of a single column (which is the default behaviour).
    """
    return json.loads(df.to_json(orient='records'))


def insert_records_from_json(table, engine, json_filepath, column_names, max_level):
    """
    Normalizes JSON data and inserts it into a table.

    Args:
        table: Table. The table to insert JSON data into.
        engine: MockConnection. The SQLAlchemy engine.
        json_filepath: str. The path to the stored JSON data file.
        column_names: List[str]. List of column names.
        max_level: int. The depth upto which JSON dict should be flattened.

    Algorithm:
        1.  We convert JSON data into Python object using json.load().
        2.  We normalize data into a pandas dataframe using pandas.json_normalize() method.
            The method takes column names as meta. We provide all possible keys as column
            names, hence it adds missing keys to JSON objects and marks their values as NaN.
        3.  We get records from the dataframe using the method get_records_from_dataframe().
        4.  The processed data is now a list of dict objects. Each dict has same keys, that are
            the column names of the table. We loop through each dict object, and if any value is
            a dict or a list, we stringify them before inserting them into the table. This way,
            our type inference logic kicks in later on converting them into
            'MathesarCustomType.MATHESAR_JSON_OBJECT' and 'MathesarCustomType.MATHESAR_JSON_ARRAY'
            respectively.
        5.  We pass data (a list of dicts) to 'insert_record_or_records()' method which inserts
            them into the table.
    """

    with open(json_filepath, 'r') as json_file:
        data = json.load(json_file)

    """
    data: JSON object. The data we want to normalize.
    max_level: int. Max number of levels(depth of dict) to normalize.
        Normalizing a dict involes flattening it and if max_level is None,
        pandas normalizes all levels. Default max_level is kept 0.
    meta: Fields to use as metadata for each record in resulting table. Without meta,
        the method chooses keys from the first JSON object it encounters as column names.
        We provide column names as meta, because we want all possible keys as columns in
        our table and not just the keys from the first JSON object.
    """
    df = pandas.json_normalize(data, max_level=max_level, meta=column_names)
    records = get_records_from_dataframe(df)

    for i, row in enumerate(records):
        if ID in row and ID_ORIGINAL in column_names:
            row[ID_ORIGINAL] = row.pop("id")
        records[i] = {
            k: json.dumps(v)
            if (isinstance(v, dict) or isinstance(v, list))
            else v
            for k, v in row.items()
        }
    insert_record_or_records(table, engine, records)


def insert_records_from_excel(table, engine, dataframe):
    records = get_records_from_dataframe(dataframe)
    insert_record_or_records(table, engine, records)


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


def insert_from_select(from_table, target_table, engine, col_mappings=None):
    if col_mappings:
        from_table_col_list, target_table_col_list = zip(
            *[
                (from_table.c[from_col], target_table.c[target_col])
                for from_col, target_col in col_mappings
            ]
        )
    else:
        from_table_col_list = [
            col for col in from_table.c
            if not MathesarColumn.from_column(col).is_default
        ]
        target_table_col_list = [
            col for col in target_table.c
            if not MathesarColumn.from_column(col).is_default
        ]
    with engine.begin() as conn:
        sel = select(from_table_col_list)
        ins = target_table.insert().from_select(target_table_col_list, sel)
        try:
            result = conn.execute(ins)
        except IntegrityError as e:
            if type(e.orig) is NotNullViolation:
                raise NotNullError
            elif type(e.orig) is ForeignKeyViolation:
                raise ForeignKeyError
            elif type(e.orig) is UniqueViolation:
                # ToDo: Try to differentiate between the types of unique violations
                # Scenario 1: Adding a duplicate value into a column with uniqueness constraint in the target table.
                # Scenario 2: Adding a non existing value twice in a column with uniqueness constraint in the target table.
                # Both the scenarios currently result in the same exception being thrown.
                raise UniqueValueError
            elif type(e.orig) is ExclusionViolation:
                raise ExclusionError
            else:
                raise e
        except ProgrammingError as e:
            if type(e.orig) is DatatypeMismatch:
                raise TypeMismatchError
            else:
                raise e
    return target_table, result
