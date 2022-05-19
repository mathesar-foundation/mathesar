from django.core.cache import cache

from mathesar import models


def test_create_table_settings(column_test_table, client):
    cache.clear()
    columns = list(models.Column.objects.filter(table=column_test_table).values_list('id', flat=True))
    data = {
        "preview_columns": {
            'columns': columns,
        }
    }
    response = client.post(
        f"/api/db/v0/tables/{column_test_table.id}/settings/",
        data=data,
    )
    response_data = response.json()
    assert response.status_code == 201
    assert response_data['preview_columns']['columns'] == columns
    assert response_data['preview_columns']['customized'] is True
