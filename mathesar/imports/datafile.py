import io
import itertools

import clevercsv as csv

from db.constants import COLUMN_NAME_TEMPLATE
from db.identifiers import truncate_if_necessary
from db.tables import create_and_import_from_rows
from db.records import insert_from_select

from mathesar.models.base import DataFile


def copy_datafile_to_table(
    user,
    data_file_id,
    table_name,
    schema_oid,
    conn,
    comment=None,
    import_into_temp_table=False,
    header_to_validate=[]
):
    data_file = DataFile.objects.get(id=data_file_id, user=user)
    header = data_file.header
    dialect = csv.dialect.SimpleDialect(
        data_file.delimiter,
        data_file.quotechar,
        data_file.escapechar
    )
    table_name = table_name or data_file.base_name

    with data_file.file.open("rb") as raw:
        f = io.TextIOWrapper(raw, encoding=data_file.encoding, newline="")
        reader = csv.reader(f, dialect)
        first_row = next(reader)
        if header:
            if import_into_temp_table:
                assert list(enumerate(first_row)) == header_to_validate, "Parsing mismatch"
            column_names = _process_column_names(first_row)
            rows = reader
        else:
            column_names = [
                f"{COLUMN_NAME_TEMPLATE}{i}" for i in range(len(first_row))
            ]
            # The first row is data, not a header: chain it back in
            rows = itertools.chain([first_row], reader)
        processed_rows = ([None if val == '' else val for val in row] for row in rows)
        import_info = create_and_import_from_rows(
            processed_rows,
            table_name,
            schema_oid,
            column_names,
            conn,
            comment=comment,
            import_into_temp_table=import_into_temp_table
        )

    return {
        "oid": import_info['table_oid'],
        "name": import_info.get('table_name'),
        "renamed_columns": import_info.get('renamed_columns'),
        "pkey_column_attnum": import_info.get('pkey_column_attnum'),
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


def insert_into_existing_table(user, data_file_id, target_table_oid, mappings, conn):
    header_to_validate = sorted([
        (
            i["csv_column"]["index"], i["csv_column"].get("name")
        ) for i in mappings
    ], key=lambda x: x[0])  # sometimes we don't have "name" when there is no header.
    temp_table = copy_datafile_to_table(
        user,
        data_file_id,
        table_name=None,
        schema_oid=None,
        conn=conn,
        comment=None,
        import_into_temp_table=True,
        header_to_validate=header_to_validate
    )
    validated_mappings = [
        {
            'src_table_attnum': int(i["csv_column"]["index"]) + 1,  # The src/temp table attnums are indexed starting from 1
            # but, the indicies we receive from the frontend start from 0, hence the +1.
            'dst_table_attnum': i["table_column"]
        } for i in mappings if i["table_column"] is not None
    ]
    inserted_rows = insert_from_select(conn, temp_table["oid"], target_table_oid, validated_mappings)
    return inserted_rows
