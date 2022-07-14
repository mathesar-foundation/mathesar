from db.types.base import PostgresType


def test_columns(client, minimal_patents_query):
    ui_query = minimal_patents_query
    response = client.get(f'/api/db/v0/queries/{ui_query.id}/columns/')
    response_json = response.json()
    assert response.status_code == 200
    assert response_json == [
        {
            'alias': 'col1',
            'name': 'Column 1',
            'type': PostgresType.TEXT.id,
            'type_options': None,
            'display_options': dict(a=1),
        },
        {
            'alias': 'col2',
            'name': 'Column 2',
            'type': PostgresType.TEXT.id,
            'type_options': None,
            'display_options': dict(b=2),
        },
    ]
