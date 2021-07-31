import os

import pytest
from unittest.mock import patch
from django.core.files import File

from mathesar.imports import csv
from mathesar.models import DataFile
from mathesar.errors import InvalidTableError


def verify_data_file_data(data_file, data_file_dict):
    assert data_file_dict['id'] == data_file.id
    assert data_file_dict['file'] == f'http://testserver/media/{data_file.file.name}'
    assert data_file_dict['created_from'] == data_file.created_from
    if data_file.table_imported_to:
        assert data_file_dict['table_imported_to'] == data_file.table_imported_to.id
    else:
        assert data_file_dict['table_imported_to'] is None
    if data_file.user:
        assert data_file_dict['user'] == data_file.user.id
    else:
        assert data_file_dict['user'] is None
    assert data_file_dict['delimiter'] == data_file.delimiter
    assert data_file_dict['quotechar'] == data_file.quotechar
    assert data_file_dict['escapechar'] == data_file.escapechar
    assert data_file_dict.get('header', True) == data_file.header


@pytest.fixture
def data_file(csv_filename):
    with open(csv_filename, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


def test_data_file_list(client, data_file):
    """
    Desired format:
    {
        "count": 1,
        "results": [
            {
                "id": 1,
                "file": "http://testserver/media/anonymous/patents.csv",
                "table": {
                    "id": 1,
                    "name": "NASA Patents",
                    "url": "http://testserver/api/v0/tables/1/"
                },
                "user": 1
            }
        ]
    }
    """
    response = client.get('/api/v0/data_files/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1

    data_file_dict = response_data['results'][0]
    verify_data_file_data(data_file, data_file_dict)


def test_data_file_detail(client, data_file):
    response = client.get(f'/api/v0/data_files/{data_file.id}/')
    data_file_dict = response.json()

    assert response.status_code == 200
    verify_data_file_data(data_file, data_file_dict)


@pytest.mark.parametrize('header', [True, False])
def test_data_file_create_csv(client, csv_filename, header):
    num_data_files = DataFile.objects.count()

    with open(csv_filename, 'rb') as csv_file:
        data = {'file': csv_file, 'header': header}
        response = client.post('/api/v0/data_files/', data)
        data_file_dict = response.json()
        data_file = DataFile.objects.get(id=data_file_dict['id'])
    with open(csv_filename, 'r') as csv_file:
        correct_dialect = csv.get_sv_dialect(csv_file)

    assert response.status_code == 201
    assert DataFile.objects.count() == num_data_files + 1
    assert data_file.created_from == 'file'
    assert data_file.base_name == 'patents'
    assert data_file.delimiter == correct_dialect.delimiter
    assert data_file.quotechar == correct_dialect.quotechar
    assert data_file.escapechar == correct_dialect.escapechar
    assert data_file.header == header
    verify_data_file_data(data_file, data_file_dict)


def test_data_file_create_csv_long_name(client, csv_filename):
    with open(csv_filename, 'rb') as csv_file:
        with patch.object(os.path, 'basename', lambda _: '0' * 101):
            data = {'file': csv_file}
            response = client.post('/api/v0/data_files/', data)
            data_file_dict = response.json()
    assert response.status_code == 400
    assert 'Ensure this filename has at most 100' in data_file_dict['file'][0]


@pytest.mark.parametrize('header', [True, False])
def test_data_file_create_paste(client, paste_filename, header):
    num_data_files = DataFile.objects.count()
    with open(paste_filename, 'r') as paste_file:
        paste_text = paste_file.read()

    data = {'paste': paste_text, 'header': header}
    response = client.post('/api/v0/data_files/', data)
    data_file_dict = response.json()
    data_file = DataFile.objects.get(id=data_file_dict['id'])

    assert response.status_code == 201
    assert DataFile.objects.count() == num_data_files + 1
    assert data_file.created_from == 'paste'
    assert data_file.base_name == ''
    assert data_file.delimiter == '\t'
    assert data_file.quotechar == ''
    assert data_file.escapechar == ''
    assert data_file.header == header
    verify_data_file_data(data_file, data_file_dict)


def test_data_file_update(client, data_file):
    response = client.put(f'/api/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PUT" not allowed.'


def test_data_file_partial_update(client, data_file):
    response = client.patch(f'/api/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PATCH" allowed only for header.'


def test_data_file_delete(client, data_file):
    response = client.delete(f'/api/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "DELETE" not allowed.'


def test_data_file_404(client, data_file):
    data_file_id = data_file.id
    data_file.delete()
    response = client.get(f'/api/v0/data_files/{data_file_id}/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'


def test_datafile_create_invalid_file(client):
    file = 'mathesar/tests/data/csv_parsing/patents_invalid.csv'
    with patch.object(csv, "get_sv_dialect") as mock_infer:
        mock_infer.side_effect = InvalidTableError
        with open(file, 'r') as f:
            response = client.post('/api/v0/data_files/', data={'file': f})
            response_dict = response.json()
    assert response.status_code == 400
    assert response_dict[0] == 'Unable to tabulate data'


def test_datafile_create_multiple_source_fields(client, csv_filename, paste_filename):
    with open(paste_filename, 'r') as paste_file:
        paste_text = paste_file.read()
    with open(csv_filename, 'rb') as csv_file:
        data = {'file': csv_file, 'paste': paste_text}
        response = client.post('/api/v0/data_files/', data)
        response_dict = response.json()
    assert response.status_code == 400
    assert 'Multiple source fields passed:' in response_dict['non_field_errors'][0]


def test_datafile_createno_source_fields(client):
    response = client.post('/api/v0/data_files/', {})
    response_dict = response.json()
    assert response.status_code == 400
    assert 'should be specified.' in response_dict['non_field_errors'][0]
