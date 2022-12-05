import pytest

from django.core.cache import cache
from django.core.files.base import File, ContentFile
from sqlalchemy import text

from db.columns.operations.select import get_column_attnum_from_name, get_column_attnum_from_names_as_map
from db.types.base import PostgresType, MathesarCustomType
from db.metadata import get_empty_metadata
from mathesar.models.users import DatabaseRole, SchemaRole
from mathesar.models.query import UIQuery

from mathesar.state import reset_reflection
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.models.base import Column, Table, DataFile


@pytest.fixture
def schema_name():
    return 'table_tests'


@pytest.fixture
def schema(create_schema, schema_name):
    return create_schema(schema_name)


@pytest.fixture
def data_file(patents_csv_filepath):
    with open(patents_csv_filepath, 'rb') as csv_file:
        data_file = DataFile.objects.create(
            file=File(csv_file),
            created_from='file',
            base_name='patents'
        )
    return data_file


@pytest.fixture
def paste_data_file(paste_filename):
    with open(paste_filename, 'r') as paste_file:
        paste_text = paste_file.read()
    data_file = DataFile.objects.create(
        file=ContentFile(paste_text, name='paste_file.txt'),
        created_from='paste',
        delimiter='\t',
        quotechar='',
        escapechar='',
    )
    return data_file


@pytest.fixture
def url_data_file(patents_url, patents_url_filename):
    base_name = patents_url.split('/')[-1].split('.')[0]
    with open(patents_url_filename, 'rb') as file:
        data_file = DataFile.objects.create(
            file=File(file),
            created_from='url',
            base_name=base_name
        )
    return data_file


def check_table_response(response_table, table, table_name):
    assert response_table['id'] == table.id
    assert response_table['name'] == table_name
    assert response_table['schema'] == table.schema.id
    assert response_table['settings']['preview_settings']['template'] == table.settings.preview_settings.template
    assert 'import_target' in response_table
    assert 'created_at' in response_table
    assert 'updated_at' in response_table
    assert 'has_dependents' in response_table
    assert 'import_verified' in response_table
    assert len(response_table['columns']) == len(table.sa_column_names)
    for column in response_table['columns']:
        assert column['name'] in table.sa_column_names
        assert 'type' in column
    assert response_table['records_url'].startswith('http')
    assert response_table['columns_url'].startswith('http')
    assert response_table['constraints_url'].startswith('http')
    assert response_table['type_suggestions_url'].startswith('http')
    assert response_table['previews_url'].startswith('http')
    assert '/api/db/v0/tables/' in response_table['records_url']
    assert '/api/db/v0/tables/' in response_table['columns_url']
    assert '/api/db/v0/tables/' in response_table['constraints_url']
    assert '/api/db/v0/tables/' in response_table['type_suggestions_url']
    assert '/api/db/v0/tables/' in response_table['previews_url']
    assert response_table['records_url'].endswith('/records/')
    assert response_table['columns_url'].endswith('/columns/')
    assert response_table['constraints_url'].endswith('/constraints/')
    assert response_table['type_suggestions_url'].endswith('/type_suggestions/')
    assert response_table['previews_url'].endswith('/previews/')


def check_table_filter_response(response, status_code=None, count=None):
    response_data = response.json()
    if status_code is not None:
        assert response.status_code == status_code
    if count is not None:
        assert response_data['count'] == count
        assert len(response_data['results']) == count


def _create_table(client, data_files, table_name, schema, import_target_table, description=None):
    body = {
        'name': table_name,
        'schema': schema.id,
        'description': description
    }
    if data_files is not None:
        body['data_files'] = [df.id for df in data_files]
        if import_target_table is not None:
            body['import_target'] = import_target_table.id

    response = client.post('/api/db/v0/tables/', body)
    response_table = response.json()
    table = Table.objects.get(id=response_table['id'])

    if data_files is not None:
        for df in data_files:
            df.refresh_from_db()

    return response, response_table, table


def _get_expected_name(table_name, data_file=None):
    if not table_name and data_file:
        return data_file.base_name
    elif not table_name and data_file is None:
        return f'Table {Table.objects.count()}'
    else:
        return table_name


def check_create_table_response(
    client, name, expt_name, data_file, schema, first_row, column_names, import_target_table
):
    num_tables = Table.objects.count()

    response, response_table, table = _create_table(client, [data_file], name, schema, import_target_table)

    assert response.status_code == 201
    assert Table.objects.count() == num_tables + 1
    assert table.get_records()[0] == first_row
    assert all([col in table.sa_column_names for col in column_names])
    assert data_file.table_imported_to.id == table.id
    assert table.import_target == import_target_table
    check_table_response(response_table, table, expt_name)


list_clients_with_results_count = [
    ('superuser_client_factory', 3),
    ('db_manager_client_factory', 3),
    ('db_editor_client_factory', 3),
    ('schema_manager_client_factory', 2),
    ('schema_viewer_client_factory', 2),
    ('db_viewer_schema_manager_client_factory', 3)
]

write_clients_with_status_code = [
    ('superuser_client_factory', 201),
    ('db_manager_client_factory', 201),
    ('db_editor_client_factory', 400),
    ('schema_manager_client_factory', 201),
    ('schema_viewer_client_factory', 400),
    ('db_viewer_schema_manager_client_factory', 201)
]

update_client_with_status_code = [
    ('db_manager_client_factory', 200),
    ('db_editor_client_factory', 403),
    ('schema_manager_client_factory', 200),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 200)
]


def test_table_list(create_patents_table, client):
    """
    Desired format:
    {
        'count': 1,
        'results': [
            {
                'id': 1,
                'name': 'NASA Table List',
                'schema': 'http://testserver/api/db/v0/schemas/1/',
                'created_at': '2021-04-27T18:43:41.201851Z',
                'updated_at': '2021-04-27T18:43:41.201898Z',
                'columns': [
                    {
                        'name': 'id',
                        'type': PostgresType.INTEGER.id
                    },
                    {
                        'name': 'Center',
                        'type': PostgresType.CHARACTER_VARYING.id
                    },
                    # etc.
                ],
                'records_url': 'http://testserver/api/db/v0/tables/3/records/'
            }
        ]
    }
    """
    table_name = 'NASA Table List'
    table = create_patents_table(table_name)

    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    response_table = None
    for table_data in response_data['results']:
        if table_data['name'] == table_name:
            response_table = table_data
            break
    assert response.status_code == 200
    assert response_data['count'] >= 1
    assert len(response_data['results']) >= 1
    check_table_response(response_table, table, table_name)


@pytest.mark.parametrize('client_name,expected_table_count', list_clients_with_results_count)
def test_table_list_based_on_permissions(
        create_patents_table, patent_schema,
        create_table,
        request,
        client_name,
        expected_table_count
):
    create_patents_table('Private Table', schema_name='Private Schema')
    create_patents_table("Patent Table 1")
    create_patents_table("Patent Table 2")
    client = request.getfixturevalue(client_name)(patent_schema)

    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    assert response_data['count'] == expected_table_count


def test_table_list_filter_name(create_patents_table, client):
    expected_tables = {
        'Filter Name 1': create_patents_table('Filter Name 1'),
        'Filter Name 2': create_patents_table('Filter Name 2'),
        'Filter Name 3': create_patents_table('Filter Name 3')
    }

    filter_tables = ['Filter Name 1', 'Filter Name 2']
    query_str = ','.join(filter_tables)
    response = client.get(f'/api/db/v0/tables/?name={query_str}')
    response_data = response.json()
    check_table_filter_response(response, status_code=200, count=2)

    response_tables = {res['name']: res for res in response_data['results']}
    for table_name in filter_tables:
        assert table_name in response_tables
        table = expected_tables[table_name]
        response_table = response_tables[table_name]
        check_table_response(response_table, table, table_name)


def test_table_list_filter_schema(create_patents_table, client):
    expected_tables = {
        'Schema 1': create_patents_table('Filter Schema 1', schema_name='Schema 1'),
        'Schema 2': create_patents_table('Filter Schema 2', schema_name='Schema 2'),
        'Schema 3': create_patents_table('Filter Schema 3', schema_name='Schema 3')
    }

    schema_name = 'Schema 1'
    schema_id = expected_tables[schema_name].schema.id
    response = client.get(f'/api/db/v0/tables/?schema={schema_id}')
    response_data = response.json()
    check_table_filter_response(response, status_code=200, count=1)

    response_tables = {res['schema']: res
                       for res in response_data['results']}

    assert schema_id in response_tables
    table = expected_tables[schema_name]
    response_table = response_tables[schema_id]
    check_table_response(response_table, table, table.name)


def test_table_list_order_by_name(create_patents_table, client):
    table_2 = create_patents_table('Filter Name 2')
    table_1 = create_patents_table('Filter Name 1')
    table_4 = create_patents_table('Filter Name 4')
    table_3 = create_patents_table('Filter Name 3')
    table_5 = create_patents_table('Filter Name 5')
    unsorted_expected_tables = [table_5, table_3, table_4, table_1, table_2]
    expected_tables = [table_1, table_2, table_3, table_4, table_5]
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    response_tables = response_data['results']
    comparison_tuples = zip(response_tables, unsorted_expected_tables)
    for comparison_tuple in comparison_tuples:
        check_table_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name)
    sort_field = 'name'
    response = client.get(f'/api/db/v0/tables/?sort_by={sort_field}')
    response_data = response.json()
    response_tables = response_data['results']
    comparison_tuples = zip(response_tables, expected_tables)
    for comparison_tuple in comparison_tuples:
        check_table_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name)


def test_table_list_order_by_id(create_patents_table, client):
    table_1 = create_patents_table('Filter Name 1')
    table_2 = create_patents_table('Filter Name 2')
    table_3 = create_patents_table('Filter Name 3')
    unsorted_expected_tables = [
        table_3,
        table_2,
        table_1
    ]
    expected_tables = [
        table_1,
        table_2,
        table_3
    ]

    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    response_tables = response_data['results']
    comparison_tuples = zip(response_tables, unsorted_expected_tables)
    for comparison_tuple in comparison_tuples:
        check_table_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name)

    sort_field = 'id'
    response = client.get(f'/api/db/v0/tables/?sort_by={sort_field}')
    response_data = response.json()
    response_tables = response_data['results']
    comparison_tuples = zip(response_tables, expected_tables)
    for comparison_tuple in comparison_tuples:
        check_table_response(comparison_tuple[0], comparison_tuple[1], comparison_tuple[1].name)


@pytest.mark.parametrize('timestamp_type', ['created', 'updated'])
def test_table_list_filter_timestamps(create_patents_table, client, timestamp_type):
    table_name = f'Fitler {timestamp_type}'
    table = create_patents_table(table_name)
    query_str = '2020-01-01 8:00'

    response = client.get(f'/api/db/v0/tables/?{timestamp_type}_before={query_str}')
    response_data = response.json()
    check_table_filter_response(response, status_code=200, count=0)

    response = client.get(f'/api/db/v0/tables/?{timestamp_type}_after={query_str}')
    response_data = response.json()
    check_table_filter_response(response, status_code=200, count=1)
    check_table_response(response_data['results'][0], table, table_name)

    timestamp = table.created_at if timestamp_type == 'created' else table.updated_at
    response = client.get(f'/api/db/v0/tables/?{timestamp_type}={timestamp}')
    response_data = response.json()
    check_table_filter_response(response, status_code=200, count=1)
    check_table_response(response_data['results'][0], table, table_name)


def test_table_list_filter_import_verified(create_patents_table, client):
    expected_tables = {
        True: create_patents_table('Filter Verified 1'),
        False: create_patents_table('Filter Verified 2'),
    }
    for verified, table in expected_tables.items():
        table.import_verified = verified
        table.save()

    for verified, table in expected_tables.items():
        query_str = str(verified).lower()
        response = client.get(f'/api/db/v0/tables/?import_verified={query_str}')
        response_data = response.json()
        check_table_filter_response(response, status_code=200, count=1)
        check_table_response(response_data['results'][0], table, table.name)


def test_table_list_filter_imported(create_patents_table, client):
    expected_tables = {
        None: create_patents_table('Filter Imported 1'),
        False: create_patents_table('Filter Imported 2'),
        True: create_patents_table('Filter Imported 3'),
    }
    for verified, table in expected_tables.items():
        table.import_verified = verified
        table.save()

    response = client.get('/api/db/v0/tables/?not_imported=false')
    check_table_filter_response(response, status_code=200, count=2)

    table = expected_tables[None]
    response = client.get('/api/db/v0/tables/?not_imported=true')
    response_data = response.json()
    check_table_filter_response(response, status_code=200, count=1)
    check_table_response(response_data['results'][0], table, table.name)


def test_table_detail(create_patents_table, client):
    """
    Desired format:
    One item in the results list in the table list view, see above.
    """
    table_name = 'NASA Table Detail'
    table = create_patents_table(table_name)

    response = client.get(f'/api/db/v0/tables/{table.id}/')
    response_table = response.json()
    assert response.status_code == 200
    check_table_response(response_table, table, table_name)


@pytest.fixture
def type_inference_table(create_table, get_uid):
    return create_table(
        table_name=get_uid(),
        schema_name=get_uid(),
        csv_filepath='mathesar/tests/data/type_inference.csv',
    )


@pytest.fixture
def _type_inference_table_type_suggestions():
    return {
        'col_1': PostgresType.NUMERIC.id,
        'col_2': PostgresType.BOOLEAN.id,
        'col_3': PostgresType.BOOLEAN.id,
        'col_4': PostgresType.TEXT.id,
        'col_5': PostgresType.TEXT.id,
        'col_6': PostgresType.NUMERIC.id,
        'col_7': MathesarCustomType.MATHESAR_MONEY.id,
    }


def test_table_type_suggestion(client, type_inference_table, _type_inference_table_type_suggestions):
    table = type_inference_table
    response = client.get(f'/api/db/v0/tables/{table.id}/type_suggestions/')
    response_table = response.json()
    assert response.status_code == 200
    expected_types = _type_inference_table_type_suggestions
    assert response_table == expected_types


def _check_columns(actual_column_list, expected_column_list):
    # Columns will return an extra type_options key in actual_dict
    # so we need to check equality only for the keys in expect_dict
    actual_column_list = [
        {k: v for k, v in actual_column.items() if k in expected_column}
        for actual_column, expected_column
        in zip(actual_column_list, expected_column_list)
    ]
    _assert_lists_of_dicts_are_equal(actual_column_list, expected_column_list)


def _assert_lists_of_dicts_are_equal(a, b):
    assert len(a) == len(b)
    for d in a:
        assert d in b


@pytest.fixture
def _type_inference_table_previews_post_body(_type_inference_table_type_suggestions):
    return {
        'columns': [
            {'name': 'id', 'type': PostgresType.INTEGER.id}
        ] + [
            {'name': id, 'type': db_type_id}
            for id, db_type_id
            in _type_inference_table_type_suggestions.items()
        ]
    }


def test_table_previews(client, type_inference_table, _type_inference_table_previews_post_body):
    table = type_inference_table
    post_body = _type_inference_table_previews_post_body
    response = client.post(f'/api/db/v0/tables/{table.id}/previews/', data=post_body)
    assert response.status_code == 200
    expect_dict = {
        'name': table.name,
        'columns': post_body['columns'],
        'records': [
            {'id': 1, 'col_1': 0.0, 'col_2': False, 'col_3': True, 'col_4': 't', 'col_5': 'a', 'col_6': 2.0, 'col_7': 5},
            {'id': 2, 'col_1': 2.0, 'col_2': True, 'col_3': False, 'col_4': 'false', 'col_5': 'cat', 'col_6': 1.0, 'col_7': 1},
            {'id': 3, 'col_1': 1.0, 'col_2': True, 'col_3': True, 'col_4': '2', 'col_5': 'mat', 'col_6': 0.0, 'col_7': 2},
            {'id': 4, 'col_1': 0.0, 'col_2': False, 'col_3': False, 'col_4': '0', 'col_5': 'bat', 'col_6': 0.0, 'col_7': 3}
        ],
    }
    actual_dict = response.json()
    assert all([expect_dict[key] == actual_dict[key] for key in expect_dict if key in ['name', 'records']])
    _check_columns(actual_dict['columns'], expect_dict['columns'])


def _find_post_body_column_ix_by_name(post_body, name):
    return tuple(column['name'] for column in post_body['columns']).index(name)


def test_table_previews_wrong_column_number(client, type_inference_table, _type_inference_table_previews_post_body):
    table = type_inference_table

    post_body = _type_inference_table_previews_post_body
    del post_body['columns'][_find_post_body_column_ix_by_name(post_body, 'col_1')]

    response = client.post(f'/api/db/v0/tables/{table.id}/previews/', data=post_body)
    assert response.status_code == 400
    assert 'number' in response.json()[0]['message']
    assert ErrorCodes.ColumnSizeMismatch.value == response.json()[0]['code']


def test_table_previews_invalid_type_cast_check(client, type_inference_table, _type_inference_table_previews_post_body):
    table = type_inference_table

    post_body = _type_inference_table_previews_post_body
    post_body['columns'][_find_post_body_column_ix_by_name(post_body, 'col_5')]['type'] = MathesarCustomType.EMAIL.id

    response = client.post(f'/api/db/v0/tables/{table.id}/previews/', data=post_body)
    assert response.status_code == 400
    assert 'Invalid type' in response.json()[0]['message']


def test_table_previews_unsupported_type(client, type_inference_table, _type_inference_table_previews_post_body):
    table = type_inference_table

    post_body = _type_inference_table_previews_post_body
    post_body['columns'][_find_post_body_column_ix_by_name(post_body, 'col_1')]['type'] = 'notatype'

    response = client.post(f'/api/db/v0/tables/{table.id}/previews/', data=post_body)
    assert response.status_code == 400
    assert 'Unknown database type identifier' in response.json()[0]['message']
    assert 'columns' in response.json()[0]['field']


def test_table_previews_missing_columns(client, type_inference_table):
    table = type_inference_table

    post_body = {}

    response = client.post(f'/api/db/v0/tables/{table.id}/previews/', data=post_body)
    assert response.status_code == 400
    assert 'required' in response.json()[0]['message']
    assert 'columns' in response.json()[0]['field']


@pytest.mark.parametrize('table_name', ['Test Table Create From Datafile', ''])
def test_table_create_from_datafile(client, data_file, schema, table_name):
    expt_name = _get_expected_name(table_name, data_file=data_file)
    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['Center', 'Status', 'Case Number', 'Patent Number',
                    'Application SN', 'Title', 'Patent Expiration Date']

    check_create_table_response(
        client, table_name, expt_name, data_file, schema, first_row, column_names, import_target_table=None
    )


@pytest.mark.parametrize('table_name', ['Test Table Create From Datafile', ''])
def test_table_create_from_datafile_with_import_target(client, data_file, schema, table_name):
    _, _, import_target_table = _create_table(client, None, 'target_table', schema, import_target_table=None)
    expt_name = _get_expected_name(table_name, data_file=data_file)
    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['Center', 'Status', 'Case Number', 'Patent Number',
                    'Application SN', 'Title', 'Patent Expiration Date']

    check_create_table_response(
        client, table_name, expt_name, data_file, schema, first_row, column_names, import_target_table
    )


@pytest.mark.parametrize('table_name', ['Test Table Create From Paste', ''])
def test_table_create_from_paste(client, schema, paste_data_file, table_name):
    expt_name = _get_expected_name(table_name)
    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['Center', 'Status', 'Case Number', 'Patent Number',
                    'Application SN', 'Title', 'Patent Expiration Date']

    check_create_table_response(
        client, table_name, expt_name, paste_data_file, schema, first_row, column_names, import_target_table=None
    )


@pytest.mark.parametrize('table_name', ['Test Table Create From URL', ''])
def test_table_create_from_url(client, schema, url_data_file, table_name):
    expt_name = _get_expected_name(table_name, data_file=url_data_file)
    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['center', 'status', 'case_number', 'patent_number',
                    'application_sn', 'title', 'patent_expiration_date']

    check_create_table_response(
        client, table_name, expt_name, url_data_file, schema, first_row, column_names, import_target_table=None
    )


@pytest.mark.parametrize('data_files', [None, []])
@pytest.mark.parametrize('table_name', ['test_table_no_file', ''])
def test_table_create_without_datafile(client, schema, data_files, table_name):
    num_tables = Table.objects.count()
    expt_name = _get_expected_name(table_name)

    expect_comment = 'test comment for table create'
    response, response_table, table = _create_table(
        client, data_files, table_name, schema, import_target_table=None,
        description=expect_comment
    )

    assert response.status_code == 201
    assert Table.objects.count() == num_tables + 1
    assert len(table.sa_columns) == 1  # only the internal `id` column
    assert len(table.get_records()) == 0
    assert table.description == expect_comment
    assert response_table['description'] == expect_comment
    check_table_response(response_table, table, expt_name)


def test_table_create_name_taken(client, paste_data_file, schema, create_patents_table, schema_name):
    create_patents_table('Table 2', schema_name=schema_name)
    create_patents_table('Table 3', schema_name=schema_name)
    expt_name = 'Table 4'

    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['Center', 'Status', 'Case Number', 'Patent Number',
                    'Application SN', 'Title', 'Patent Expiration Date']

    check_create_table_response(
        client, '', expt_name, paste_data_file, schema, first_row, column_names, import_target_table=None
    )


def test_table_create_base_name_taken(client, data_file, schema, create_patents_table, schema_name):
    create_patents_table('patents', schema_name=schema_name)
    create_patents_table('patents 1', schema_name=schema_name)
    expt_name = 'patents 2'

    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['Center', 'Status', 'Case Number', 'Patent Number',
                    'Application SN', 'Title', 'Patent Expiration Date']

    check_create_table_response(
        client, '', expt_name, data_file, schema, first_row, column_names, import_target_table=None
    )


def test_table_create_base_name_too_long(client, data_file, schema):
    data_file.base_name = '0' * 100
    data_file.save()
    expt_name = 'Table 0'

    first_row = (1, 'NASA Kennedy Space Center', 'Application', 'KSC-12871', '0',
                 '13/033,085', 'Polyimide Wire Insulation Repair System', None)
    column_names = ['Center', 'Status', 'Case Number', 'Patent Number',
                    'Application SN', 'Title', 'Patent Expiration Date']

    check_create_table_response(
        client, '', expt_name, data_file, schema, first_row, column_names, import_target_table=None
    )


get_encoding_test_list = [
    ('mathesar/tests/data/non_unicode_files/cp1250.csv', 'cp1250', (1, '2',
                                                                    '1.7 Cubic Foot Compact "Cube" Office Refrigerators',
                                                                    'Barry French',
                                                                    '293', '457.81', '208.16', '68.02', 'Nunavut',
                                                                    'Appliances', '0.58'),
     ['1', 'Eldon Base for stackable storage shelf, platinum', 'Muhammed MacIntyre',
      '3', '-213.25', '38.94', '35', 'Nunavut', 'Storage & Organization', '0.8']),

    ('mathesar/tests/data/non_unicode_files/utf_16_le.csv', 'utf_16_le', (1, 'Troy', '2004', 'English'),
     ['Title', 'Year', 'Language']),
]


@pytest.mark.parametrize('non_unicode_file_path, filename, first_row, column_names', get_encoding_test_list)
def test_table_create_non_unicode(client, non_unicode_file_path, filename, first_row, column_names,
                                  schema, create_data_file):
    expt_name = filename
    non_unicode_datafile = create_data_file(non_unicode_file_path, filename)
    check_create_table_response(
        client, '', expt_name, non_unicode_datafile, schema, first_row, column_names, import_target_table=None
    )


def test_table_create_with_same_name(client, schema):
    table_name = 'test_table_duplicate'
    body = {
        'name': table_name,
        'schema': schema.id,
    }
    client.post('/api/db/v0/tables/', body)
    response = client.post('/api/db/v0/tables/', body)
    response_error = response.json()
    assert response.status_code == 400
    assert response_error[0]['code'] == ErrorCodes.DuplicateTableError.value
    assert response_error[0]['message'] == f'Relation {table_name} already exists in schema {schema.id}'


def test_table_create_multiple_users_different_roles(client_bob, client_alice, user_bob, user_alice, schema):
    table_name = 'test_table'
    body = {
        'name': table_name,
        'schema': schema.id,
    }

    response = client_bob.post('/api/db/v0/tables/', body)
    assert response.status_code == 400
    DatabaseRole.objects.create(database=schema.database, user=user_bob, role='manager')
    response = client_bob.post('/api/db/v0/tables/', body)
    assert response.status_code == 201

    # Create different table by a different user
    body['name'] = 'test_table_1'
    response = client_alice.post('/api/db/v0/tables/', body)
    assert response.status_code == 400
    alice_schema_role = SchemaRole.objects.create(schema=schema, user=user_alice, role='viewer')
    response = client_alice.post('/api/db/v0/tables/', body)
    assert response.status_code == 400
    alice_schema_role.delete()
    alice_schema_role = SchemaRole.objects.create(schema=schema, user=user_alice, role='manager')
    response = client_alice.post('/api/db/v0/tables/', body)
    assert response.status_code == 201
    alice_schema_role.delete()
    response = client_alice.post('/api/db/v0/tables/', body)
    assert response.status_code == 400


@pytest.mark.parametrize('client_name, expected_status_code', write_clients_with_status_code)
def test_table_create(schema, request, client_name, expected_status_code):
    table_name = 'test_table'
    body = {
        'name': table_name,
        'schema': schema.id,
    }
    client = request.getfixturevalue(client_name)(schema)
    response = client.post('/api/db/v0/tables/', body)
    assert response.status_code == expected_status_code


def test_table_partial_update_by_superuser(create_patents_table, client):
    table_name = 'NASA Table Partial Update'
    new_table_name = 'NASA Table Partial Update New'
    table = create_patents_table(table_name)

    expect_comment = 'a super new test comment'
    body = {'name': new_table_name, 'description': expect_comment}
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    response_table = response.json()
    assert response.status_code == 200
    assert response_table
    assert response_table['description'] == expect_comment
    check_table_response(response_table, table, new_table_name)

    table = Table.objects.get(oid=table.oid)
    assert table.name == new_table_name


def test_table_partial_update_import_verified(create_patents_table, client):
    table_name = 'NASA Table Import Verify'
    table = create_patents_table(table_name)

    body = {'import_verified': True}
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    response_table = response.json()
    assert response.status_code == 200
    assert response_table['import_verified'] is True


def test_table_partial_update_schema(create_patents_table, client):
    table_name = 'NASA Table Schema PATCH'
    table = create_patents_table(table_name)

    body = {'schema': table.schema.id}
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    response_error = response.json()[0]
    assert response.status_code == 400
    assert response_error['message'] == 'Updating schema for tables is not supported.'
    assert response_error['code'] == ErrorCodes.UnsupportedAlter.value


@pytest.mark.parametrize('client_name, expected_status_code', update_client_with_status_code)
def test_table_partial_update_by_different_roles(create_patents_table, request, client_name, expected_status_code):
    table_name = 'NASA Table Partial Update'
    new_table_name = 'NASA Table Partial Update New'
    table = create_patents_table(table_name)
    client = request.getfixturevalue(client_name)(table.schema)
    expect_comment = 'a super new test comment'
    body = {'name': new_table_name, 'description': expect_comment}
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    assert response.status_code == expected_status_code


def test_table_delete(create_patents_table, client):
    table_name = 'NASA Table Delete'
    table = create_patents_table(table_name)
    table_count = len(Table.objects.all())

    response = client.delete(f'/api/db/v0/tables/{table.id}/')
    assert response.status_code == 204

    # Ensure the Django model was deleted
    new_table_count = len(Table.objects.all())
    assert table_count - 1 == new_table_count
    assert Table.objects.filter(id=table.id).exists() is False


delete_clients_with_status_codes = [
    ('superuser_client_factory', 204, 204),
    ('db_manager_client_factory', 204, 204),
    ('db_editor_client_factory', 403, 403),
    ('schema_manager_client_factory', 204, 404),
    ('schema_viewer_client_factory', 403, 404),
    ('db_viewer_schema_manager_client_factory', 204, 403)
]


@pytest.mark.parametrize('client_name, expected_status_code, different_schema_expected_status_code', delete_clients_with_status_codes)
def test_table_delete_by_different_roles(
        create_patents_table,
        request,
        client_name,
        expected_status_code,
        different_schema_expected_status_code,
):
    different_schema_table = create_patents_table('Private Table', schema_name='Private Schema')
    table_name = 'NASA Table Delete'
    table = create_patents_table(table_name)
    client = request.getfixturevalue(client_name)(table.schema)
    response = client.delete(f'/api/db/v0/tables/{table.id}/')
    assert response.status_code == expected_status_code
    response = client.delete(f'/api/db/v0/tables/{different_schema_table.id}/')
    assert response.status_code == different_schema_expected_status_code


def test_table_dependencies(client, create_patents_table):
    table_name = 'NASA Table Dependencies'
    table = create_patents_table(table_name)

    response = client.get(f'/api/db/v0/tables/{table.id}/')
    response_table = response.json()
    assert response.status_code == 200
    assert response_table['has_dependents'] is True


def test_table_404(client):
    response = client.get('/api/db/v0/tables/3000/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_table_type_suggestion_404(client):
    response = client.get('/api/db/v0/tables/3000/type_suggestions/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_table_create_from_datafile_404(client):
    body = {
        'data_files': [-999],
        'name': 'test_table',
        'schema': -999,
    }
    response = client.post('/api/db/v0/tables/', body)
    response_table = response.json()
    assert response.status_code == 400
    assert 'object does not exist' in response_table[0]['message']
    assert response_table[0]['field'] == 'schema'
    assert 'object does not exist' in response_table[1]['message']
    assert response_table[1]['field'] == 'data_files'


def test_table_create_from_multiple_datafile(client, data_file, schema):
    body = {
        'data_files': [data_file.id, data_file.id],
        'name': 'test_table',
        'schema': schema.id,
    }
    response = client.post('/api/db/v0/tables/', body)
    response_table = response.json()
    assert response.status_code == 400
    assert response_table[0]['message'] == 'Multiple data files are unsupported.'
    assert response_table[0]['field'] == 'data_files'


def test_table_partial_update_invalid_field(create_patents_table, client):
    table_name = 'NASA Table Partial Update'
    table = create_patents_table(table_name)

    body = {'schema': table.schema.id}
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    assert response.status_code == 400
    assert 'is not supported' in response.json()[0]['message']


def test_table_partial_update_404(client):
    response = client.patch('/api/db/v0/tables/3000/', {})
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_table_delete_404(client):
    response = client.delete('/api/db/v0/tables/3000/')
    assert response.status_code == 404
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_table_update(client, create_patents_table):
    table = create_patents_table('update_table_test')
    response = client.put(f'/api/db/v0/tables/{table.id}/')
    assert response.status_code == 405
    assert response.json()[0]['message'] == 'Method "PUT" not allowed.'
    assert response.json()[0]['code'] == ErrorCodes.MethodNotAllowed.value


def test_table_get_with_reflect_new(client, table_for_reflection):
    _, table_name, _ = table_for_reflection
    response = client.get('/api/db/v0/tables/')
    # The table number should only change after the GET request
    response_data = response.json()
    actual_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(actual_created) == 1
    created_table = actual_created[0]
    assert created_table['name'] == table_name
    created_columns = created_table['columns']
    check_columns_response(created_columns, [
        {'name': 'id', 'type': PostgresType.INTEGER.id, 'type_options': None, 'display_options': None},
        {'name': 'name', 'type': PostgresType.CHARACTER_VARYING.id, 'type_options': None, 'display_options': None}
    ])


def check_columns_response(created_columns, expected_response):
    # Id's are auto incrementing and vary depending up previous test cases, better to remove them before comparing
    created_columns_id = []
    for created_column in created_columns:
        created_columns_id.append(created_column.pop('id'))
    assert len(created_columns_id) == len(expected_response)
    assert created_columns == expected_response


def test_table_get_with_reflect_column_change(client, table_for_reflection):
    schema_name, table_name, engine = table_for_reflection
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    orig_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    orig_id = orig_created[0]['id']
    new_column_name = 'new_name'
    with engine.begin() as conn:
        conn.execute(
            text(f'ALTER TABLE {schema_name}.{table_name} RENAME COLUMN name TO {new_column_name};')
        )
    cache.clear()
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    altered_table = [
        table for table in response_data['results'] if table['name'] == table_name
    ][0]
    new_columns = altered_table['columns']
    assert altered_table['id'] == orig_id
    check_columns_response(new_columns, [
        {'name': 'id', 'type': PostgresType.INTEGER.id, 'type_options': None, 'display_options': None},
        {'name': new_column_name, 'type': PostgresType.CHARACTER_VARYING.id, 'type_options': None, 'display_options': None}
    ])


def test_table_get_with_reflect_name_change(client, table_for_reflection):
    schema_name, table_name, engine = table_for_reflection
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    orig_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    orig_id = orig_created[0]['id']
    new_table_name = 'super_new_table_name'
    with engine.begin() as conn:
        conn.execute(
            text(
                f'ALTER TABLE {schema_name}.{table_name} RENAME TO {new_table_name};'
            )
        )
    cache.clear()
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    orig_created_2 = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(orig_created_2) == 0
    modified = [
        table for table in response_data['results'] if table['name'] == new_table_name
    ]
    modified_id = modified[0]['id']
    assert len(modified) == 1
    assert orig_id == modified_id


def test_table_get_with_reflect_delete(client, table_for_reflection):
    schema_name, table_name, engine = table_for_reflection
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    orig_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(orig_created) == 1
    with engine.begin() as conn:
        conn.execute(text(f'DROP TABLE {schema_name}.{table_name};'))
    reset_reflection()
    response = client.get('/api/db/v0/tables/')
    response_data = response.json()
    new_created = [
        table for table in response_data['results'] if table['name'] == table_name
    ]
    assert len(new_created) == 0


def _get_patents_column_data(table):
    column_data = [{
        'name': 'id',
        'type': PostgresType.INTEGER.id,
    }, {
        'name': 'Center',
        'type': PostgresType.TEXT.id,
    }, {
        'name': 'Status',
        'type': PostgresType.TEXT.id,
    }, {
        'name': 'Case Number',
        'type': PostgresType.TEXT.id,
    }, {
        'name': 'Patent Number',
        'type': PostgresType.TEXT.id,
    }, {
        'name': 'Application SN',
        'type': PostgresType.TEXT.id,
    }, {
        'name': 'Title',
        'type': PostgresType.TEXT.id,
    }, {
        'name': 'Patent Expiration Date',
        'type': PostgresType.TEXT.id,
    }]
    bidirectmap = table.get_column_name_id_bidirectional_map()
    for data in column_data:
        name = data['name']
        data['id'] = bidirectmap[name]
    return column_data


def test_table_patch_invalid_table_name(create_patents_table, client):
    table_name = 'NASA Table'
    table = create_patents_table(table_name)
    # Having round brackets in the table name is invalid.
    invalid_table_name = 'NASA Table(alpha)'

    body = {'name': invalid_table_name}
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    response_data = response.json()[0]
    assert response.status_code == 400
    assert response_data['code'] == ErrorCodes.InvalidTableName.value
    assert response_data['message'] == f'Table name "{invalid_table_name}" is invalid.'


def test_table_patch_same_table_name(create_patents_table, client):
    table_name = 'PATCH same name'
    table = create_patents_table(table_name)

    body = {'name': table_name}
    # Need to specify format here because otherwise the body gets sent
    # as a multi-part form, which can't handle nested keys.
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    assert response.status_code == 200
    assert response.json()['name'] == table_name


def test_table_patch_columns_and_table_name(create_patents_table, client):
    table_name = 'PATCH columns 1'
    table = create_patents_table(table_name)

    body = {
        'name': 'PATCH COLUMNS 1',
        'columns': _get_patents_column_data(table)
    }
    # Need to specify format here because otherwise the body gets sent
    # as a multi-part form, which can't handle nested keys.
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)

    response_json = response.json()
    assert response.status_code == 200
    assert response_json['name'] == 'PATCH COLUMNS 1'


def test_table_patch_columns_no_changes(create_patents_table, client):
    table_name = 'PATCH columns 2'
    table = create_patents_table(table_name)
    column_data = _get_patents_column_data(table)

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_one_name_change(create_patents_table, client):
    table_name = 'PATCH columns 3'
    table = create_patents_table(table_name)
    column_data = _get_patents_column_data(table)
    column_data[1]['name'] = 'NASA Center'

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_two_name_changes(create_patents_table, client):
    table_name = 'PATCH columns 4'
    table = create_patents_table(table_name)
    column_data = _get_patents_column_data(table)
    column_data[1]['name'] = 'NASA Center'
    column_data[2]['name'] = 'Patent Status'

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_one_type_change(create_patents_table, client):
    table_name = 'PATCH columns 5'
    table = create_patents_table(table_name)
    column_data = _get_patents_column_data(table)
    column_data[7]['type'] = PostgresType.DATE.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def _get_data_types_column_data(table):
    column_data = [{
        'name': 'id',
    }, {
        'name': 'Integer',
    }, {
        'name': 'Boolean',
    }, {
        'name': 'Text',
    }, {
        'name': 'Decimal',
    }]
    bidirectmap = table.get_column_name_id_bidirectional_map()
    for data in column_data:
        name = data['name']
        data['id'] = bidirectmap[name]
    return column_data


def test_table_patch_columns_multiple_type_change(create_data_types_table, client):
    table_name = 'PATCH columns 6'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1]['type'] = PostgresType.INTEGER.id
    column_data[2]['type'] = PostgresType.BOOLEAN.id
    column_data[4]['type'] = PostgresType.NUMERIC.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()
    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_one_drop(create_data_types_table, client):
    table_name = 'PATCH columns 7'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data.pop(1)

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_multiple_drop(create_data_types_table, client):
    table_name = 'PATCH columns 8'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data.pop(1)
    column_data.pop(1)

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_diff_name_type_change(create_data_types_table, client):
    table_name = 'PATCH columns 9'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1]['type'] = PostgresType.INTEGER.id
    column_data[2]['name'] = 'Checkbox'

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_same_name_type_change(create_data_types_table, client):
    table_name = 'PATCH columns 10'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[2]['type'] = PostgresType.BOOLEAN.id
    column_data[2]['name'] = 'Checkbox'

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_multiple_name_type_change(create_data_types_table, client):
    table_name = 'PATCH columns 11'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1]['type'] = PostgresType.INTEGER.id
    column_data[1]['name'] = 'Int.'
    column_data[2]['type'] = PostgresType.BOOLEAN.id
    column_data[2]['name'] = 'Checkbox'

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_diff_name_type_drop(create_data_types_table, client):
    table_name = 'PATCH columns 12'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1]['type'] = PostgresType.INTEGER.id
    column_data[2]['name'] = 'Checkbox'
    column_data.pop(3)

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_display_options(create_data_types_table, client):
    table_name = 'patch_cols_one'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    display_options = {"use_grouping": "false"}
    column_data[0]['display_options'] = display_options
    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    actual_id_col = [c for c in response.json()['columns'] if c['name'] == 'id'][0]

    assert response.status_code == 200
    actual_display_options = actual_id_col['display_options']
    for k in display_options:
        assert actual_display_options[k] == display_options[k]


def test_table_patch_columns_invalid_display_options(create_data_types_table, client):
    table_name = 'patch_cols_two'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    # despite its name, the last column is of type text
    display_options = {"use_grouping": "false"}

    column_data[-1]['display_options'] = display_options
    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    actual_col = [c for c in response.json()['columns'] if c['name'] == 'Decimal'][0]

    assert response.status_code == 200
    assert actual_col['display_options'] == {}


def test_table_patch_columns_type_plus_display_options(create_data_types_table, client):
    table_name = 'patch_cols_three'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    # despite its name, the last column is of type text
    display_options = {"use_grouping": "false"}
    column_data[-1].update(
        {'type': PostgresType.NUMERIC.id, 'display_options': display_options}
    )
    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    actual_col = [c for c in response.json()['columns'] if c['name'] == 'Decimal'][0]

    assert response.status_code == 200
    assert actual_col['type'] == PostgresType.NUMERIC.id
    for k, v in display_options.items():
        assert actual_col['display_options'][k] == v


def test_table_patch_columns_same_name_type_drop(create_data_types_table, client):
    table_name = 'PATCH columns 13'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1] = {'id': column_data[1]['id']}
    column_data[2]['type'] = PostgresType.BOOLEAN.id
    column_data[2]['name'] = 'Checkbox'
    column_data.pop(3)

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 200
    _check_columns(response_json['columns'], column_data)


def test_table_patch_columns_invalid_type(create_data_types_table, client):
    table_name = 'PATCH columns 14'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[3]['type'] = PostgresType.BOOLEAN.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()

    assert response.status_code == 400
    assert f"{column_data[3]['name']} cannot be cast to boolean" in response_json[0]['message']


def test_table_patch_columns_invalid_type_with_name(create_data_types_table, client):
    table_name = 'PATCH columns 15'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1]['name'] = 'hello'
    column_data[3]['type'] = PostgresType.BOOLEAN.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()
    assert response.status_code == 400
    assert f"{column_data[3]['name']} cannot be cast to boolean" in response_json[0]['message']

    current_table_response = client.get(f'/api/db/v0/tables/{table.id}/')
    # The table should not have changed
    original_column_data = _get_data_types_column_data(table)
    _check_columns(current_table_response.json()['columns'], original_column_data)


def test_table_patch_columns_invalid_type_with_type(create_data_types_table, client):
    table_name = 'PATCH columns 16'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1]['type'] = PostgresType.INTEGER.id
    column_data[3]['type'] = PostgresType.BOOLEAN.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()
    assert response.status_code == 400
    assert f"{column_data[3]['name']} cannot be cast to boolean" in response_json[0]['message']

    current_table_response = client.get(f'/api/db/v0/tables/{table.id}/')
    # The table should not have changed
    original_column_data = _get_data_types_column_data(table)
    _check_columns(current_table_response.json()['columns'], original_column_data)


def test_table_patch_columns_invalid_type_with_drop(create_data_types_table, client):
    table_name = 'PATCH columns 17'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1] = {'id': column_data[1]['id']}
    column_data[3]['type'] = PostgresType.BOOLEAN.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()
    assert response.status_code == 400
    assert f"{column_data[3]['name']} cannot be cast to boolean" in response_json[0]['message']

    current_table_response = client.get(f'/api/db/v0/tables/{table.id}/')
    # The table should not have changed
    original_column_data = _get_data_types_column_data(table)
    _check_columns(current_table_response.json()['columns'], original_column_data)


def test_table_patch_columns_invalid_type_with_multiple_changes(create_data_types_table, client):
    table_name = 'PATCH columns 18'
    table = create_data_types_table(table_name)
    column_data = _get_data_types_column_data(table)
    column_data[1] = {'id': column_data[1]['id']}
    column_data[2]['name'] = 'Checkbox'
    column_data[2]['type'] = PostgresType.BOOLEAN.id
    column_data[3]['type'] = PostgresType.BOOLEAN.id

    body = {
        'columns': column_data
    }
    response = client.patch(f'/api/db/v0/tables/{table.id}/', body)
    response_json = response.json()
    assert response.status_code == 400
    assert f"{column_data[3]['name']} cannot be cast to boolean" in response_json[0]['message']

    current_table_response = client.get(f'/api/db/v0/tables/{table.id}/')
    # The table should not have changed
    original_column_data = _get_data_types_column_data(table)
    _check_columns(current_table_response.json()['columns'], original_column_data)


def test_table_extract_columns_retain_original_table(create_patents_table, client):
    table_name = 'Patents'
    table = create_patents_table(table_name)
    column_name_id_map = table.get_column_name_id_bidirectional_map()
    existing_columns = table.columns.all()
    existing_columns = [existing_column.name for existing_column in existing_columns]
    column_names_to_extract = ['Patent Number', 'Title', 'Patent Expiration Date']
    column_ids_to_extract = [column_name_id_map[name] for name in column_names_to_extract]

    extract_table_name = "Patent Info"
    split_data = {
        'extract_columns': column_ids_to_extract,
        'extracted_table_name': extract_table_name,
    }
    current_table_response = client.post(f'/api/db/v0/tables/{table.id}/split_table/', data=split_data)
    assert current_table_response.status_code == 201
    response_data = current_table_response.json()
    extracted_table_id = response_data['extracted_table']
    extracted_table = Table.objects.get(id=extracted_table_id)
    assert extract_table_name == extracted_table.name
    remainder_table_id = response_data['remainder_table']
    remainder_table = Table.objects.get(id=remainder_table_id)
    assert Table.objects.filter(id=table.id).count() == 1
    extracted_columns = extracted_table.columns.all().order_by('attnum')
    extracted_column_names = [extracted_column.name for extracted_column in extracted_columns]
    expected_extracted_column_names = ['id'] + column_names_to_extract
    assert expected_extracted_column_names == extracted_column_names

    remainder_columns = remainder_table.columns.all().order_by('attnum')
    remainder_column_names = [remainder_column.name for remainder_column in remainder_columns]
    expected_remainder_columns = (set(existing_columns) - set(column_names_to_extract)) | {'Patent Info_id'}
    assert set(expected_remainder_columns) == set(remainder_column_names)


def test_table_extract_columns_drop_original_table(create_patents_table, client):
    table_name = 'Patents'
    table = create_patents_table(table_name)
    column_name_id_map = table.get_column_name_id_bidirectional_map()
    column_names_to_extract = ['Patent Number', 'Title', 'Patent Expiration Date']
    column_ids_to_extract = [column_name_id_map[name] for name in column_names_to_extract]
    existing_columns = table.columns.all().order_by('attnum')
    existing_columns = [existing_column.name for existing_column in existing_columns]
    remainder_column_names = (set(existing_columns) - set(column_names_to_extract))

    extract_table_name = "Patent Info"
    split_data = {
        'extract_columns': column_ids_to_extract,
        'extracted_table_name': extract_table_name,
    }
    current_table_response = client.post(f'/api/db/v0/tables/{table.id}/split_table/', data=split_data)
    assert current_table_response.status_code == 201
    response_data = current_table_response.json()
    extracted_table_id = response_data['extracted_table']
    extracted_table = Table.objects.get(id=extracted_table_id)
    remainder_table_id = response_data['remainder_table']
    remainder_table = Table.objects.get(id=remainder_table_id)

    remainder_columns = remainder_table.columns.all()
    remainder_columns_map = {column.name: column for column in remainder_columns}
    metadata = get_empty_metadata()
    columns_with_attnum = get_column_attnum_from_names_as_map(remainder_table.oid, remainder_column_names, remainder_table._sa_engine, metadata=metadata)
    for remainder_column_name in remainder_column_names:
        remainder_column = remainder_columns_map[remainder_column_name]
        assert remainder_column.attnum == columns_with_attnum[remainder_column.name]
        assert remainder_column.id == column_name_id_map[remainder_column.name]

    extracted_columns = extracted_table.columns.all()
    columns_with_attnum = get_column_attnum_from_names_as_map(extracted_table.oid, column_names_to_extract, extracted_table._sa_engine, metadata=metadata)
    for extracted_column in extracted_columns:
        if extracted_column.name != 'id':
            assert extracted_column.attnum == columns_with_attnum[extracted_column.name]
            assert extracted_column.id == column_name_id_map[extracted_column.name]


def test_table_extract_columns_specify_fk_column_name(create_patents_table, client):
    table_name = 'Patents'
    table = create_patents_table(table_name)
    column_name_id_map = table.get_column_name_id_bidirectional_map()
    column_names_to_extract = ['Patent Number', 'Title', 'Patent Expiration Date']
    column_ids_to_extract = [column_name_id_map[name] for name in column_names_to_extract]
    relationship_fk_column_name = "patent_info"
    extract_table_name = "Patent Info"
    split_data = {
        'extract_columns': column_ids_to_extract,
        'extracted_table_name': extract_table_name,
        'relationship_fk_column_name': relationship_fk_column_name
    }
    current_table_response = client.post(f'/api/db/v0/tables/{table.id}/split_table/', data=split_data)
    assert current_table_response.status_code == 201
    response_data = current_table_response.json()
    remainder_table_id = response_data['remainder_table']
    remainder_table = Table.objects.get(id=remainder_table_id)
    metadata = get_empty_metadata()
    relationship_fk_column_attnum = get_column_attnum_from_name(remainder_table.oid, relationship_fk_column_name, remainder_table._sa_engine, metadata=metadata)
    assert relationship_fk_column_attnum is not None
    Column.objects.get(table_id=remainder_table_id, attnum=relationship_fk_column_attnum)


def test_table_extract_columns_with_display_options(create_patents_table, client):
    table_name = 'Patents'
    table = create_patents_table(table_name)
    column_name_id_map = table.get_column_name_id_bidirectional_map()
    column_names_to_extract = ['Patent Number', 'Title', 'Patent Expiration Date']
    column_ids_to_extract = [column_name_id_map[name] for name in column_names_to_extract]
    column_name_with_display_options = column_names_to_extract[0]
    column_id_with_display_options = column_name_id_map[column_name_with_display_options]

    column_display_options = {'show_as_percentage': True, 'number_format': 'english'}
    column_with_display_options = Column.objects.get(id=column_id_with_display_options)
    column_with_display_options.display_options = column_display_options
    column_with_display_options.save()

    extract_table_name = "Patent Info"
    split_data = {
        'extract_columns': column_ids_to_extract,
        'extracted_table_name': extract_table_name,
    }
    current_table_response = client.post(f'/api/db/v0/tables/{table.id}/split_table/', data=split_data)
    assert current_table_response.status_code == 201
    response_data = current_table_response.json()
    extracted_table_id = response_data['extracted_table']
    extracted_table = Table.objects.get(id=extracted_table_id)
    extracted_column_id = extracted_table.get_column_name_id_bidirectional_map()[column_name_with_display_options]
    extracted_column = Column.objects.get(id=extracted_column_id)
    assert extracted_column.id == extracted_column_id
    assert extracted_column.display_options == column_with_display_options.display_options


def test_table_move_columns_after_extracting(create_patents_table, client):
    table_name = 'Patents'
    table = create_patents_table(table_name)
    column_name_id_map = table.get_column_name_id_bidirectional_map()
    column_names_to_extract = ['Title', 'Patent Expiration Date']
    column_ids_to_extract = [column_name_id_map[name] for name in column_names_to_extract]

    extract_table_name = "Patent Info"
    split_data = {
        'extract_columns': column_ids_to_extract,
        'extracted_table_name': extract_table_name,
    }
    current_table_response = client.post(f'/api/db/v0/tables/{table.id}/split_table/', data=split_data)
    assert current_table_response.status_code == 201
    remainder_table_id = current_table_response.json()['remainder_table']
    extracted_table_id = current_table_response.json()['extracted_table']
    column_names_to_move = ['Patent Number']
    column_ids_to_move = [column_name_id_map[name] for name in column_names_to_move]
    column_display_options = {'show_as_percentage': True, 'number_format': 'english'}
    column_name_with_display_options = column_names_to_move[0]
    column_id_with_display_options = column_name_id_map[column_name_with_display_options]
    column_with_display_options = Column.objects.get(id=column_id_with_display_options)
    column_with_display_options.display_options = column_display_options
    column_with_display_options.save()
    move_data = {
        'move_columns': column_ids_to_move,
        'target_table': extracted_table_id,
    }
    current_table_response = client.post(f'/api/db/v0/tables/{remainder_table_id}/move_columns/', data=move_data)
    assert current_table_response.status_code == 201
    extracted_table = Table.objects.get(id=extracted_table_id)
    extracted_column_id = extracted_table.get_column_name_id_bidirectional_map()[column_name_with_display_options]
    extracted_column = Column.objects.get(id=extracted_column_id)
    assert extracted_column.id == extracted_column_id
    assert extracted_column.display_options == column_with_display_options.display_options


split_table_client_with_different_roles = [
    ('superuser_client_factory', 201),
    ('db_manager_client_factory', 201),
    ('db_editor_client_factory', 403),
    ('schema_manager_client_factory', 201),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 201)
]


@pytest.mark.parametrize('client_name, expected_status_code', split_table_client_with_different_roles)
def test_table_extract_columns_by_different_roles(create_patents_table, request, client_name, expected_status_code):
    table_name = 'Patents'
    table = create_patents_table(table_name)
    column_name_id_map = table.get_column_name_id_bidirectional_map()
    column_names_to_extract = ['Patent Number', 'Title', 'Patent Expiration Date']
    column_ids_to_extract = [column_name_id_map[name] for name in column_names_to_extract]

    extract_table_name = "Patent Info"
    split_data = {
        'extract_columns': column_ids_to_extract,
        'extracted_table_name': extract_table_name,
    }
    client = request.getfixturevalue(client_name)(table.schema)
    current_table_response = client.post(f'/api/db/v0/tables/{table.id}/split_table/', data=split_data)
    assert current_table_response.status_code == expected_status_code


def test_table_ui_dependency(client, create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    query_data = {
        "name": get_uid(),
        "base_table": base_table,
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [[1, 3], [4, 5]],
                "alias": "alias_x",
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    query = UIQuery.objects.create(**query_data)
    response = client.get(f'/api/db/v0/tables/{base_table.id}/ui_dependents/')
    response_data = response.json()
    expected_response = {
        'queries': [
            query.id
        ]
    }
    assert response_data == expected_response
