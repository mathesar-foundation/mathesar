from mathesar.models.base import Database
from mathesar.filters.base import get_available_filters


def test_filter_list(client, test_db_name):
    database = Database.objects.get(name=test_db_name)

    response = client.get(f'/api/ui/v0/databases/{database.id}/filters/')
    response_data = response.json()
    assert response.status_code == 200
    for available_filter in response_data:
        assert all([key in available_filter for key in ['id', 'name', 'parameters']])
    assert len(response_data) == len(get_available_filters(database._sa_engine))
