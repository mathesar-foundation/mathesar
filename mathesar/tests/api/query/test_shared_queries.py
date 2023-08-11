import pytest
import uuid

from mathesar.models.shares import SharedQuery


@pytest.fixture
def schemas_with_shared_queries(create_minimal_patents_query):
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
        'patent_schema': query.base_table.schema,
        'patent_query': query,
        'patent_query_share': share,
        'different_schema': different_schema_query.base_table.schema,
        'different_schema_query': different_schema_query,
        'different_schema_query_share': different_schema_share,
    }

    # cleanup
    share.delete()
    query.delete()
    query.base_table.delete()
    different_schema_share.delete()
    different_schema_query.delete()
    different_schema_query.base_table.delete()


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
    schemas_with_shared_queries,
    request,
    client_name,
    different_schema_status_code,
):
    client = request.getfixturevalue(client_name)(schemas_with_shared_queries["patent_schema"])
    response = client.get(f'/api/ui/v0/queries/{schemas_with_shared_queries["patent_query"].id}/shares/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['count'] == 1
    assert len(response_data['results']) == 1
    result = response_data['results'][0]
    assert result['slug'] == str(schemas_with_shared_queries['patent_query_share'].slug)
    assert result['enabled'] == schemas_with_shared_queries['patent_query_share'].enabled

    response = client.get(f'/api/ui/v0/queries/{schemas_with_shared_queries["different_schema_query"].id}/shares/')
    assert response.status_code == different_schema_status_code
    if different_schema_status_code == 200:
        response_data = response.json()
        assert len(response_data['results']) == 1
        result = response_data['results'][0]
        assert result['slug'] == str(schemas_with_shared_queries['different_schema_query_share'].slug)
        assert result['enabled'] == schemas_with_shared_queries['different_schema_query_share'].enabled


@pytest.mark.parametrize('client_name,different_schema_status_code', read_client_with_different_roles)
def test_shared_query_retrieve(
    schemas_with_shared_queries,
    request,
    client_name,
    different_schema_status_code,
):
    client = request.getfixturevalue(client_name)(schemas_with_shared_queries["patent_schema"])
    response = client.get(f'/api/ui/v0/queries/{schemas_with_shared_queries["patent_query"].id}/shares/{schemas_with_shared_queries["patent_query_share"].id}/')
    response_data = response.json()

    assert response.status_code == 200
    assert response_data['slug'] == str(schemas_with_shared_queries['patent_query_share'].slug)
    assert response_data['enabled'] == schemas_with_shared_queries['patent_query_share'].enabled

    response = client.get(f'/api/ui/v0/queries/{schemas_with_shared_queries["different_schema_query"].id}/shares/{schemas_with_shared_queries["different_schema_query_share"].id}/')
    assert response.status_code == different_schema_status_code
    if different_schema_status_code == 200:
        response_data = response.json()
        assert response_data['slug'] == str(schemas_with_shared_queries['different_schema_query_share'].slug)
        assert response_data['enabled'] == schemas_with_shared_queries['different_schema_query_share'].enabled


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
    schemas_with_shared_queries,
    request,
    client_name,
    is_allowed
):
    client = request.getfixturevalue(client_name)(schemas_with_shared_queries["patent_schema"])
    data = {'enabled': False}
    response = client.patch(f'/api/ui/v0/queries/{schemas_with_shared_queries["patent_query"].id}/shares/{schemas_with_shared_queries["patent_query_share"].id}/', data)
    response_data = response.json()

    if is_allowed:
        assert response.status_code == 200
        assert response_data['slug'] == str(schemas_with_shared_queries['patent_query_share'].slug)
        assert response_data['enabled'] is False
    else:
        assert response.status_code == 403


@pytest.mark.parametrize('client_name,is_allowed', write_client_with_different_roles)
def test_shared_query_delete(
    schemas_with_shared_queries,
    request,
    client_name,
    is_allowed
):
    client = request.getfixturevalue(client_name)(schemas_with_shared_queries["patent_schema"])
    response = client.delete(f'/api/ui/v0/queries/{schemas_with_shared_queries["patent_query"].id}/shares/{schemas_with_shared_queries["patent_query_share"].id}/')

    if is_allowed:
        assert response.status_code == 204
        assert SharedQuery.objects.filter(id=schemas_with_shared_queries['patent_query_share'].id).first() is None
    else:
        assert response.status_code == 403


@pytest.mark.parametrize('client_name,is_allowed', write_client_with_different_roles)
def test_shared_query_regenerate_link(
    schemas_with_shared_queries,
    request,
    client_name,
    is_allowed
):
    client = request.getfixturevalue(client_name)(schemas_with_shared_queries["patent_schema"])
    old_slug = str(schemas_with_shared_queries["patent_query_share"].slug)
    response = client.post(f'/api/ui/v0/queries/{schemas_with_shared_queries["patent_query"].id}/shares/{schemas_with_shared_queries["patent_query_share"].id}/regenerate/')
    response_data = response.json()

    if is_allowed:
        assert response.status_code == 200
        assert response_data['slug'] != old_slug
    else:
        assert response.status_code == 403


# Query endpoints with share-link-uuid token

queries_request_client_with_different_roles = [
    # (client_name, same_schema_invalid_token_status, different_schema_invalid_token_status)
    ('superuser_client_factory', 200, 200),
    ('db_manager_client_factory', 200, 200),
    ('db_editor_client_factory', 200, 200),
    ('schema_manager_client_factory', 200, 403),
    ('schema_viewer_client_factory', 200, 403),
    ('db_viewer_schema_manager_client_factory', 200, 200),
    ('anonymous_client_factory', 401, 401)
]


@pytest.mark.parametrize('client_name,same_schema_invalid_token_status,different_schema_invalid_token_status', queries_request_client_with_different_roles)
@pytest.mark.parametrize('endpoint', ['/', '/results/'])
def test_shared_query_view_requests(
    schemas_with_shared_queries,
    request,
    endpoint,
    client_name,
    same_schema_invalid_token_status,
    different_schema_invalid_token_status
):
    client = request.getfixturevalue(client_name)(schemas_with_shared_queries["patent_schema"])

    query_url = f'/api/db/v0/queries/{schemas_with_shared_queries["patent_query"].id}'
    share_uuid_param = f'shared-link-uuid={schemas_with_shared_queries["patent_query_share"].slug}'
    invalid_share_uuid_param = f'shared-link-uuid={uuid.uuid4()}'
    different_schema_query_url = f'/api/db/v0/queries/{schemas_with_shared_queries["different_schema_query"].id}'
    different_schema_query_uuid_param = f'shared-link-uuid={schemas_with_shared_queries["different_schema_query_share"].slug}'
    is_result_endpoint = endpoint == '/results/'

    response = client.get(f'{query_url}{endpoint}?{share_uuid_param}')
    response_data = response.json()
    assert response.status_code == 200
    if is_result_endpoint:
        assert response_data['records']['count'] == 1393

    response = client.get(f'{query_url}{endpoint}?{invalid_share_uuid_param}')
    response_data = response.json()
    assert response.status_code == same_schema_invalid_token_status
    if same_schema_invalid_token_status == 200 and is_result_endpoint:
        assert response_data['records']['count'] == 1393

    response = client.get(f'{different_schema_query_url}{endpoint}?{different_schema_query_uuid_param}')
    response_data = response.json()
    assert response.status_code == 200
    if is_result_endpoint:
        assert response_data['records']['count'] == 1393

    response = client.get(f'{different_schema_query_url}{endpoint}?{invalid_share_uuid_param}')
    response_data = response.json()
    assert response.status_code == different_schema_invalid_token_status
    if different_schema_invalid_token_status == 200 and is_result_endpoint:
        assert response_data['records']['count'] == 1393
