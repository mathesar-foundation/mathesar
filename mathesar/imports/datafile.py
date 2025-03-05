import clevercsv as csv

from db.constants import COLUMN_NAME_TEMPLATE
from db.identifiers import truncate_if_necessary
from db.tables import prepare_table_for_import

from mathesar.models.base import DataFile


def copy_datafile_to_table(
        user, data_file_id, table_name, schema_oid, conn, comment=None
):
    data_file = DataFile.objects.get(id=data_file_id, user=user)
    file_path = data_file.file.path
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(
        data_file.delimiter,
        data_file.quotechar,
        data_file.escapechar
    )
    table_name = table_name or data_file.base_name

    with open(file_path, "r", newline="") as f:
        reader = csv.reader(f, dialect)
        if header:
            column_names = _process_column_names(next(reader))
        else:
            column_names = [
                f"{COLUMN_NAME_TEMPLATE}{i}" for i in range(len(next(reader)))
            ]
    copy_sql, table_oid, db_table_name, renamed_columns = prepare_table_for_import(
        table_name,
        schema_oid,
        column_names,
        conn,
        comment
    )
    cursor = conn.cursor()
    with open(file_path, "r", newline="") as f, cursor.copy(copy_sql) as copy:
        reader = csv.reader(f, dialect)
        if header:
            column_names = next(reader)
        for row in reader:
            copy.write_row(row)

    return {"oid": table_oid, "name": db_table_name, "renamed_columns": renamed_columns}


def _process_column_names(column_names):
    column_names = (
        column_name.strip()
        for column_name
        in column_names
    )
    column_names = (
        truncate_if_necessary(column_name)
        for column_name
        in column_names
    )
    column_names = (
        f"{COLUMN_NAME_TEMPLATE}{i}" if name == '' else name
        for i, name
        in enumerate(column_names)
    )
    return list(column_names)
