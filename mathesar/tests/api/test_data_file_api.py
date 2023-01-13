import os

import pytest
from mathesar.errors import URLNotReachable
from unittest.mock import patch
from django.core.files import File

from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.imports import csv
from mathesar.models.base import DataFile
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
def data_file(patents_csv_filepath):
    with open(patents_csv_filepath, 'rb') as csv_file:
        data_file = DataFile.objects.create(file=File(csv_file))
    return data_file


@pytest.fixture(scope='session')
def patents_url_data(patents_url_filename):
    with open(patents_url_filename, 'r') as f:
        return f.read()


def check_create_data_file_response(response, num_files, created_from, base_name,
                                    delimiter, quotechar, escapechar, header):
    assert response.status_code == 201
    data_file_dict = response.json()
    data_file = DataFile.objects.get(id=data_file_dict['id'])

    assert DataFile.objects.count() == num_files + 1
    assert data_file.created_from == created_from
    assert data_file.base_name == base_name
    assert data_file.delimiter == delimiter
    assert data_file.quotechar == quotechar
    assert data_file.escapechar == escapechar
    assert data_file.header == header
    verify_data_file_data(data_file, data_file_dict)


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
                    "url": "http://testserver/api/db/v0/tables/1/"
                },
                "user": 1
            }
        ]
    }
    """
    response = client.get('/api/db/v0/data_files/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1

    data_file_dict = response_data['results'][0]
    verify_data_file_data(data_file, data_file_dict)


def test_data_file_detail(client, data_file):
    response = client.get(f'/api/db/v0/data_files/{data_file.id}/')
    data_file_dict = response.json()

    assert response.status_code == 200
    verify_data_file_data(data_file, data_file_dict)


@pytest.mark.parametrize('header', [True, False])
def test_data_file_create_csv(client, patents_csv_filepath, header):
    num_data_files = DataFile.objects.count()

    with open(patents_csv_filepath, 'rb') as csv_file:
        data = {'file': csv_file, 'header': header}
        response = client.post('/api/db/v0/data_files/', data, format='multipart')
    with open(patents_csv_filepath, 'r') as csv_file:
        correct_dialect = csv.get_sv_dialect(csv_file)
    check_create_data_file_response(
        response, num_data_files, 'file', 'patents', correct_dialect.delimiter,
        correct_dialect.quotechar, correct_dialect.escapechar, header
    )


def test_data_file_create_csv_long_name(client, patents_csv_filepath):
    with open(patents_csv_filepath, 'rb') as csv_file:
        with patch.object(os.path, 'basename', lambda _: '0' * 101):
            data = {'file': csv_file}
            response = client.post('/api/db/v0/data_files/', data, format='multipart')
            data_file_dict = response.json()
    assert response.status_code == 400
    assert 'Ensure this filename has at most 100' in data_file_dict[0]['message']
    assert data_file_dict[0]['code'] == 2043


@pytest.mark.parametrize('header', [True, False])
def test_data_file_create_paste(client, paste_filename, header):
    num_data_files = DataFile.objects.count()
    with open(paste_filename, 'r') as paste_file:
        paste_text = paste_file.read()

    data = {'paste': paste_text, 'header': header}
    response = client.post('/api/db/v0/data_files/', data)

    check_create_data_file_response(
        response, num_data_files, 'paste', '', '\t', '', '', header
    )


@pytest.mark.parametrize('header', [True, False])
def test_data_file_create_url(client, header, patents_url, patents_url_data, mocked_responses):
    mocked_responses.get(
        url=patents_url,
        body=patents_url_data,
        status=200,
        content_type='text/csv',
    )
    mocked_responses.head(
        url=patents_url,
        status=200,
        content_type='text/csv',
    )
    num_data_files = DataFile.objects.count()
    data = {'url': patents_url, 'header': header}
    response = client.post('/api/db/v0/data_files/', data)

    base_name = patents_url.split('/')[-1].split('.')[0]
    check_create_data_file_response(
        response, num_data_files, 'url', base_name, ',', '"', '', header
    )


def test_data_file_update(client, data_file):
    response = client.put(f'/api/db/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    response_data = response.json()[0]
    assert response_data['message'] == 'Method "PUT" not allowed.'
    assert response_data['code'] == ErrorCodes.MethodNotAllowed.value


def test_data_file_partial_update(client, data_file):
    response = client.patch(f'/api/db/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()[0]['message'] == 'Method "PATCH" allowed only for header.'
    assert response.json()[0]['code'] == ErrorCodes.MethodNotAllowed.value


def test_data_file_delete(client, data_file):
    response = client.delete(f'/api/db/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()[0]['message'] == 'Method "DELETE" not allowed.'
    assert response.json()[0]['code'] == ErrorCodes.MethodNotAllowed.value


def test_data_file_404(client, data_file):
    data_file_id = data_file.id
    data_file.delete()
    response = client.get(f'/api/db/v0/data_files/{data_file_id}/')
    assert response.json()[0]['message'] == 'Not found.'
    assert response.json()[0]['code'] == ErrorCodes.NotFound.value


def test_data_file_create_invalid_file(client):
    file = 'mathesar/tests/data/csv_parsing/patents_invalid.csv'
    with patch.object(csv, "get_sv_dialect") as mock_infer:
        mock_infer.side_effect = InvalidTableError
        with open(file, 'r') as f:
            response = client.post('/api/db/v0/data_files/', data={'file': f}, format='multipart')
            response_dict = response.json()
    assert response.status_code == 400
    assert response_dict[0]['message'] == 'Unable to tabulate data'


def test_data_file_create_non_unicode_file(client, non_unicode_csv_filepath):
    with open(non_unicode_csv_filepath, 'rb') as non_unicode_file:
        response = client.post('/api/db/v0/data_files/', data={'file': non_unicode_file}, format='multipart')
    assert response.status_code == 201


def test_data_file_create_url_invalid_format(client):
    url = 'invalid_url'
    response = client.post('/api/db/v0/data_files/', data={'url': url})
    response_dict = response.json()
    assert response.status_code == 400
    assert response_dict[0]['message'] == 'Enter a valid URL.'
    assert response_dict[0]['field'] == 'url'


def test_data_file_create_url_invalid_address(client, mocked_responses):
    url = 'https://www.test.invalid'
    mocked_responses.head(
        url=url,
        body=URLNotReachable(),
    )
    response = client.post('/api/db/v0/data_files/', data={'url': url})
    response_dict = response.json()
    assert response.status_code == 400
    assert response_dict[0]['message'] == 'URL cannot be reached.'


def test_data_file_create_url_invalid_download(
    client, patents_url, mocked_responses
):
    mocked_responses.head(
        url=patents_url,
        status=400,
    )
    mocked_responses.get(
        url=patents_url,
        status=400,
    )
    response = client.post('/api/db/v0/data_files/', data={'url': patents_url})
    response_dict = response.json()
    assert response.status_code == 400
    assert response_dict[0]['message'] == 'URL cannot be downloaded.'


def test_data_file_create_url_invalid_content_type(client, mocked_responses):
    url = 'https://www.google.com'
    mocked_responses.head(
        url=url,
        status=200,
        content_type='text/html',
    )
    response = client.post('/api/db/v0/data_files/', data={'url': url})
    response_dict = response.json()
    assert response.status_code == 400
    assert response_dict[0]['message'] == "URL resource 'text/html' not a valid type."


def test_data_file_create_multiple_source_fields(client, patents_csv_filepath, paste_filename):
    with open(paste_filename, 'r') as paste_file:
        paste_text = paste_file.read()
    with open(patents_csv_filepath, 'rb') as csv_file:
        data = {'file': csv_file, 'paste': paste_text}
        response = client.post('/api/db/v0/data_files/', data, format='multipart')
        response_dict = response.json()
    assert response.status_code == 400
    assert 'Multiple source fields passed:' in response_dict[0]['message']


def test_data_file_create_no_source_fields(client):
    response = client.post('/api/db/v0/data_files/', {})
    response_dict = response.json()
    assert response.status_code == 400
    assert 'should be specified.' in response_dict[0]['message']
