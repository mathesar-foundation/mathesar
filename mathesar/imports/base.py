from mathesar.database.base import create_mathesar_engine
from mathesar.models.base import Table
from mathesar.imports.csv import create_db_table_from_csv_data_file
from mathesar.imports.json import create_db_table_from_json_data_file
from db.tables.operations.select import get_oid_from_table
from mathesar.errors import InvalidTableError

ALLOWED_DELIMITERS = ",\t:|;"
SAMPLE_SIZE = 20000
CHECK_ROWS = 10


def create_table_from_data_file(data_file, name, schema, comment=None):
    engine = create_mathesar_engine(schema.database.name)
    if data_file.type == 'csv' or data_file.type == 'tsv':
        db_table = create_db_table_from_csv_data_file(
            data_file, name, schema, comment=comment
        )
    elif data_file.type == 'json':
        db_table = create_db_table_from_json_data_file(
            data_file, name, schema, comment=comment
        )
    else:
        raise InvalidTableError
    db_table_oid = get_oid_from_table(db_table.name, db_table.schema, engine)
    # Using current_objects to create the table instead of objects. objects
    # triggers re-reflection, which will cause a race condition to create the table
    table = Table.current_objects.get(
        oid=db_table_oid,
        schema=schema,
    )
    table.import_verified = False
    table.save()
    data_file.table_imported_to = table
    data_file.save()
    return table
