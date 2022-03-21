from django.core.files.base import File

from db.tests.types import fixtures
from mathesar.models import DataFile, Table
from mathesar.utils.display_options_inference import infer_mathesar_money_display_options

engine_with_types = fixtures.engine_with_types
engine_email_type = fixtures.engine_email_type
temporary_testing_schema = fixtures.temporary_testing_schema


def test_display_options_inference(client, patent_schema):
    engine = patent_schema._sa_engine
    table_name = 'Type Inference Table'
    file = 'mathesar/tests/data/display_options_inference.csv'
    with open(file, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))

    body = {
        'data_files': [data_file.id],
        'name': table_name,
        'schema': patent_schema.id,
    }
    response_table = client.post('/api/db/v0/tables/', body).json()
    table = Table.objects.get(id=response_table['id'])
    infer_mathesar_money_display_options(table.oid, engine, "col_4")
