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
            raw_col_names = next(reader)
            if import_into_temp_table:
                assert list(enumerate(raw_col_names, start=1)) == header_to_validate, "Parsing mismatch"
            column_names = _process_column_names(raw_col_names)
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
    header_to_validate = sorted([(i["csv_column"]["index"], i["csv_column"]["name"]) for i in mappings], key=lambda x: x[0])
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
            'src_table_attnum': i["csv_column"]["index"],
            'dst_table_attnum': i["table_column"]
        } for i in mappings if i["table_column"] is not None
    ]
    inserted_rows = insert_from_select(conn, temp_table["oid"], target_table_oid, validated_mappings)
    return inserted_rows
