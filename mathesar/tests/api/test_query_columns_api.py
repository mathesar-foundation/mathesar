import pytest

from mathesar.models.query import UIQuery
from db.types.base import PostgresType


@pytest.fixture
def minimal_patents_query(create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    initial_columns = [
        {
            'id': base_table.get_column_by_name('Center').id,
            'alias': 'col1',
        },
        {
            'id': base_table.get_column_by_name('Case Number').id,
            'alias': 'col2',
        },
    ]
    ui_query = UIQuery.objects.create(
        base_table=base_table,
        initial_columns=initial_columns,
    )
    return ui_query


def test_columns(client, minimal_patents_query):
    ui_query = minimal_patents_query
    response = client.get(f'/api/db/v0/queries/{ui_query.id}/columns/')
    response_json = response.json()
    assert response.status_code == 200
    assert response_json == [
        {
            'alias': 'col1',
            'name': None,
            'type': PostgresType.TEXT.id,
            'type_options': None,
            'display_options': None,
        },
        {
            'alias': 'col2',
            'name': None,
            'type': PostgresType.TEXT.id,
            'type_options': None,
            'display_options': None,
        },
    ]
