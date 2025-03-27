import clevercsv as csv

from db.constants import COLUMN_NAME_TEMPLATE
from db.identifiers import truncate_if_necessary
from db.tables import create_and_import_from_rows

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
            f.seek(0)
        import_info = create_and_import_from_rows(
            reader,
            table_name,
            schema_oid,
            column_names,
            conn,
            comment=comment,
        )

    return {
        "oid": import_info['table_oid'],
        "name": import_info['table_name'],
        "renamed_columns": import_info['renamed_columns'],
        "pkey_column_attnum": import_info['pkey_column_attnum'],
    }


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
