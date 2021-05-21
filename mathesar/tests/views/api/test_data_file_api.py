from mathesar.models import DataFile


def verify_data_file_data(data_file, data_file_dict):
    assert data_file_dict['id'] == data_file.id
    assert data_file_dict['file'] == f'http://testserver/media/{data_file.file.name}'
    if data_file.table_imported_to:
        assert data_file_dict['table_imported_to'] == data_file.table.id
    else:
        assert data_file_dict['table_imported_to'] is None
    if data_file.schema:
        assert data_file_dict['schema'] == data_file.schema.id
    else:
        assert data_file_dict['schema'] is None
    if data_file.user:
        assert data_file_dict['user'] == data_file.user.id
    else:
        assert data_file_dict['user'] is None


def test_data_file_list(client, csv_filename):
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
    data_file = DataFile.objects.create(file=csv_filename)
    response = client.get('/api/v0/data_files/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1

    data_file_dict = response_data['results'][0]
    verify_data_file_data(data_file, data_file_dict)


def test_data_file_detail(client, csv_filename):
    data_file = DataFile.objects.create(file=csv_filename)
    response = client.get(f'/api/v0/data_files/{data_file.id}/')
    data_file_dict = response.json()

    assert response.status_code == 200
    verify_data_file_data(data_file, data_file_dict)


def test_data_file_create(client, csv_filename):
    num_data_files = DataFile.objects.count()

    with open(csv_filename, 'rb') as csv_file:
        data = {
            'file': csv_file
        }
        response = client.post('/api/v0/data_files/', data=data)
        data_file_dict = response.json()
        data_file = DataFile.objects.get(id=data_file_dict['id'])

        assert response.status_code == 201
        assert DataFile.objects.count() == num_data_files + 1
        verify_data_file_data(data_file, data_file_dict)


def test_data_file_create_with_wrong_extension(client):
    with open('mathesar/tests/textfile.txt', 'rb') as text_file:
        data = {
            'file': text_file
        }
        response = client.post('/api/v0/data_files/', data=data)
        assert response.status_code == 400
        assert response.json()['file'][0] == 'File extension “txt” is not allowed. Allowed extensions are: csv.'


def test_data_file_create_with_table_imported_to(client, csv_filename):
    num_data_files = DataFile.objects.count()

    with open(csv_filename, 'rb') as csv_file:
        data = {
            'file': csv_file,
            'table_imported_to': 1
        }
        response = client.post('/api/v0/data_files/', data=data)
        data_file_dict = response.json()
        data_file = DataFile.objects.get(id=data_file_dict['id'])

        assert response.status_code == 201
        assert DataFile.objects.count() == num_data_files + 1
        # Ensure that the table is not actually saved.
        assert data_file_dict['table_imported_to'] is None
        verify_data_file_data(data_file, data_file_dict)


def test_data_file_update(client, csv_filename):
    data_file = DataFile.objects.create(file=csv_filename)
    data = {
        'table_imported_to': 1
    }
    response = client.put(f'/api/v0/data_files/{data_file.id}/', data=data)
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PUT" not allowed.'


def test_data_file_partial_update(client, csv_filename):
    data_file = DataFile.objects.create(file=csv_filename)
    data = {
        'table_imported_to': 1
    }
    response = client.patch(f'/api/v0/data_files/{data_file.id}/', data=data)
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "PATCH" not allowed.'


def test_data_file_delete(client, csv_filename):
    data_file = DataFile.objects.create(file=csv_filename)
    response = client.delete(f'/api/v0/data_files/{data_file.id}/')
    assert response.status_code == 405
    assert response.json()['detail'] == 'Method "DELETE" not allowed.'


def test_data_file_404(client, csv_filename):
    data_file = DataFile.objects.create(file=csv_filename)
    data_file_id = data_file.id
    data_file.delete()
    response = client.get(f'/api/v0/data_files/{data_file_id}/')
    assert response.status_code == 404
    assert response.json()['detail'] == 'Not found.'
