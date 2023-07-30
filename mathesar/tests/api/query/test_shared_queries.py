import pytest

from mathesar.models.shares import SharedQuery


@pytest.fixture
def shared_test_query(create_minimal_patents_query):
    query = create_minimal_patents_query()
    share = SharedQuery.objects.create(
        query=query,
        enabled=True,
    )
    different_schema_query = create_minimal_patents_query(schema_name="Different Schema")
    different_schema_share = SharedQuery.objects.create(
        query=different_schema_query,
        enabled=True,
    )
    yield {
        'query': query,
        'share': share,
        'different_schema_query': different_schema_query,
        'different_schema_share': different_schema_share,
    }
    share.delete()


read_client_with_different_roles = [
    # (client_name, different_schema_status_code)
    ('superuser_client_factory', 200),
    ('db_manager_client_factory', 200),
    ('db_editor_client_factory', 200),
    ('schema_manager_client_factory', 403),
    ('schema_viewer_client_factory', 403),
    ('db_viewer_schema_manager_client_factory', 200)
]


write_client_with_different_roles = [
    # client_name, is_allowed
    ('superuser_client_factory', True),
    ('db_manager_client_factory', True),
    ('db_editor_client_factory', True),
    ('schema_manager_client_factory', True),
    ('schema_viewer_client_factory', False),
    ('db_viewer_schema_manager_client_factory', True)
]


@pytest.mark.parametrize('client_name,different_schema_status_code', read_client_with_different_roles)
def test_shared_query_list(
    shared_test_query,
    request,
    client_name,
    different_schema_status_code,
):
    client = request.getfixturevalue(client_name)(shared_test_query["query"].base_table.schema)
    response = client.get(f'/api/ui/v0/queries/{shared_test_query["query"].id}/shares/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    result = response_data['results'][0]
    assert result['slug'] == str(shared_test_query['share'].slug)
    assert result['enabled'] == shared_test_query['share'].enabled

    response = client.get(f'/api/ui/v0/queries/{shared_test_query["different_schema_query"].id}/shares/')
    assert response.status_code == different_schema_status_code
    if different_schema_status_code == 200:
        response_data = response.json()
        assert len(response_data['results']) == 1
        result = response_data['results'][0]
        assert result['slug'] == str(shared_test_query['different_schema_share'].slug)
        assert result['enabled'] == shared_test_query['different_schema_share'].enabled


@pytest.mark.parametrize('client_name,different_schema_status_code', read_client_with_different_roles)
def test_shared_query_retrieve(
    shared_test_query,
    request,
    client_name,
    different_schema_status_code,
):
    client = request.getfixturevalue(client_name)(shared_test_query["query"].base_table.schema)
    response = client.get(f'/api/ui/v0/queries/{shared_test_query["query"].id}/shares/{shared_test_query["share"].id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['slug'] == str(shared_test_query['share'].slug)
    assert response_data['enabled'] == shared_test_query['share'].enabled

    response = client.get(f'/api/ui/v0/queries/{shared_test_query["different_schema_query"].id}/shares/{shared_test_query["different_schema_share"].id}/')
    assert response.status_code == different_schema_status_code
    if different_schema_status_code == 200:
        response_data = response.json()
        assert response_data['slug'] == str(shared_test_query['different_schema_share'].slug)
        assert response_data['enabled'] == shared_test_query['different_schema_share'].enabled


@pytest.mark.parametrize('client_name,is_allowed', write_client_with_different_roles)
def test_shared_query_create(
    minimal_patents_query,
    request,
    client_name,
    is_allowed
):
    client = request.getfixturevalue(client_name)(minimal_patents_query.base_table.schema)
    data = {'enabled': True}
    response = client.post(f'/api/ui/v0/queries/{minimal_patents_query.id}/shares/', data)
    response_data = response.json()

    if is_allowed:
        assert response.status_code == 201
        assert 'id' in response_data
        assert response_data['enabled'] is True
        created_share = SharedQuery.objects.get(id=response_data['id'])
        assert created_share is not None
    else:
        assert response.status_code == 403


@pytest.mark.parametrize('client_name,is_allowed', write_client_with_different_roles)
def test_shared_query_patch(
    shared_test_query,
    request,
    client_name,
    is_allowed
):
    client = request.getfixturevalue(client_name)(shared_test_query["query"].base_table.schema)
    data = {'enabled': False}
    response = client.patch(f'/api/ui/v0/queries/{shared_test_query["query"].id}/shares/{shared_test_query["share"].id}/', data)
    response_data = response.json()

    if is_allowed:
        assert response.status_code == 200
        assert response_data['slug'] == str(shared_test_query['share'].slug)
        assert response_data['enabled'] is False
    else:
        assert response.status_code == 403


@pytest.mark.parametrize('client_name,is_allowed', write_client_with_different_roles)
def test_shared_query_delete(
    shared_test_query,
    request,
    client_name,
    is_allowed
):
    client = request.getfixturevalue(client_name)(shared_test_query["query"].base_table.schema)
    response = client.delete(f'/api/ui/v0/queries/{shared_test_query["query"].id}/shares/{shared_test_query["share"].id}/')

    if is_allowed:
        assert response.status_code == 204
        assert SharedQuery.objects.filter(id=shared_test_query['share'].id).first() is None
    else:
        assert response.status_code == 403
