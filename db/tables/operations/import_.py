import json
import tempfile

import clevercsv as csv
from psycopg import sql

from db.connection import exec_msar_func
from db.columns.operations.alter import _transform_column_alter_dict
from db.tables.operations.create import prepare_table_for_import
from db.encoding_utils import get_sql_compatible_encoding
from mathesar.models.deprecated import DataFile
from mathesar.imports.csv import get_file_encoding, get_sv_reader, process_column_names


def import_csv(data_file_id, table_name, schema_oid, conn, comment=None):
    data_file = DataFile.objects.get(id=data_file_id)
    file_path = data_file.file.path
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(
        data_file.delimiter,
        data_file.quotechar,
        data_file.escapechar
    )
    encoding = get_file_encoding(data_file.file)
    with open(file_path, 'rb') as csv_file:
        csv_reader = get_sv_reader(csv_file, header, dialect)
        column_names = process_column_names(csv_reader.fieldnames)
    schema_name, table_name, table_oid = prepare_table_for_import(
        table_name,
        schema_oid,
        column_names,
        conn,
        comment
    )
    insert_csv_records(
        schema_name,
        table_name,
        conn,
        file_path,
        column_names,
        header,
        dialect.delimiter,
        dialect.escapechar,
        dialect.quotechar,
        encoding
    )
    return table_oid


def insert_csv_records(
    schema_name,
    table_name,
    conn,
    file_path,
    column_names,
    header,
    delimiter=None,
    escape=None,
    quote=None,
    encoding=None
):
    conversion_encoding, sql_encoding = get_sql_compatible_encoding(encoding)
    formatted_columns = sql.SQL(",").join(sql.Identifier(column_name) for column_name in column_names)
    copy_sql = sql.SQL(
        "COPY {relation_name} ({formatted_columns}) FROM STDIN CSV {header} {delimiter} {escape} {quote} {encoding}"
    ).format(
        relation_name=sql.Identifier(schema_name, table_name),
        formatted_columns=formatted_columns,
        header=sql.SQL("HEADER" if header else ""),
        delimiter=sql.SQL(f"DELIMITER E'{delimiter}'" if delimiter else ""),
        escape=sql.SQL(f"ESCAPE '{escape}'" if escape else ""),
        quote=sql.SQL(
            ("QUOTE ''''" if quote == "'" else f"QUOTE '{quote}'")
            if quote
            else ""
        ),
        encoding=sql.SQL(f"ENCODING '{sql_encoding}'" if sql_encoding else ""),
    )
    cursor = conn.cursor()
    with open(file_path, 'r', encoding=encoding) as csv_file:
        if conversion_encoding == encoding:
            with cursor.copy(copy_sql) as copy:
                while data := csv_file.read():
                    copy.write(data)
        else:
            # File needs to be converted to compatible database supported encoding
            with tempfile.SpooledTemporaryFile(mode='wb+', encoding=conversion_encoding) as temp_file:
                while True:
                    contents = csv_file.read().encode(conversion_encoding, "replace")
                    if not contents:
                        break
                    temp_file.write(contents)
                temp_file.seek(0)
                with cursor.copy(copy_sql) as copy:
                    while data := temp_file.read():
                        copy.write(data)


def get_preview(table_oid, column_list, conn, limit=20):
    transformed_column_data = [_transform_column_alter_dict(col) for col in column_list]
    return exec_msar_func(conn, 'get_preview', table_oid, json.dumps(transformed_column_data), limit).fetchone()[0]
