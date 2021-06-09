import pytest
from django.core.files import File

from mathesar.models import DataFile


def verify_data_file_data(data_file, data_file_dict):
    assert data_file_dict['id'] == data_file.id
    assert data_file_dict['file'] == f'http://testserver/media/{data_file.file.name}'
    if data_file.table_imported_to:
        assert data_file_dict['table_imported_to'] == data_file.table_imported_to.id
    else:
        assert data_file_dict['table_imported_to'] is None
    if data_file.user:
        assert data_file_dict['user'] == data_file.user.id
    else:
        assert data_file_dict['user'] is None


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


def test_data_file_create_csv(client, csv_filename):
    num_data_files = DataFile.objects.count()

    with open(csv_filename, 'rb') as csv_file:
        response = client.post('/api/v0/data_files/', data={'file': csv_file})
        data_file_dict = response.json()
        data_file = DataFile.objects.get(id=data_file_dict['id'])

        assert response.status_code == 201
        assert DataFile.objects.count() == num_data_files + 1
        verify_data_file_data(data_file, data_file_dict)


def test_data_file_create_tsv(client, tsv_filename):
    num_data_files = DataFile.objects.count()

    with open(tsv_filename, 'rb') as tsv_file:
        response = client.post('/api/v0/data_files/', data={'file': tsv_file})
        data_file_dict = response.json()
        data_file = DataFile.objects.get(id=data_file_dict['id'])

        assert response.status_code == 201
        assert DataFile.objects.count() == num_data_files + 1
        verify_data_file_data(data_file, data_file_dict)


def test_data_file_update(client, data_file):
    response = client.put(f'/api/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PUT" not allowed.'


def test_data_file_partial_update(client, data_file):
    response = client.patch(f'/api/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PATCH" not allowed.'


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
