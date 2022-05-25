import pytest
from django.core.files.base import File

from db.columns.operations.select import get_column_attnum_from_name
from mathesar.models import DataFile, Table
from mathesar.utils.display_options_inference import infer_mathesar_money_display_options

create_display_options_test_list = [
    ('col_4', {
        'number_format': 'english',
        'currency_symbol': '₿',
        'symbol_location': 'after-minus'
    }),
    ('col_3', {
        'number_format': 'english',
        'currency_symbol': '$',
        'symbol_location': 'after-minus'
    })
]


@pytest.mark.parametrize("col_name, expected_display_options", create_display_options_test_list)
def test_display_options_inference(client, patent_schema, col_name, expected_display_options):
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
    column_attnum = get_column_attnum_from_name(table.oid, col_name, engine)
    inferred_display_options = infer_mathesar_money_display_options(table.oid, engine, column_attnum)
    assert inferred_display_options == expected_display_options
