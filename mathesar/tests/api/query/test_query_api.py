import pytest


@pytest.fixture
def post_minimal_query(_post_query, create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "name": get_uid(),
        "base_table": base_table.id,
        # TODO use actual columns
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [[1, 3], [4, 5]],
                "alias": "alias_x",
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    return _post_query(request_data)


@pytest.fixture
def _post_query(client):
    def _f(request_data):
        response = client.post('/api/db/v0/queries/', data=request_data)
        assert response.status_code == 201
        return request_data, response
    return _f


@pytest.mark.parametrize(
    "expected,actual,should_throw",
    [
        [[1, 2, 3], [1, 2, 3], False],
        [[1, 2, 4], [1, 2, 3], True],
        [3, 3, False],
        [3, 4, True],
        [dict(a=1, b=2), dict(a=1, b=2), False],
        [dict(a=1, c=2), dict(a=1, b=2), True],
        [dict(a=[1, 2, 3], b=2, c=dict(a=[1])), dict(a=[1, 2, 3], b=2, c=dict(a=[1])), False],
        [dict(a=[1, 2, 5], b=2, c=dict(a=[1])), dict(a=[1, 2, 3], b=2, c=dict(a=[1])), True],
    ]
)
def test_deep_equality_assert(expected, actual, should_throw):
    if should_throw:
        with pytest.raises(Exception):
            _deep_equality_assert(expected=expected, actual=actual)
    else:
        _deep_equality_assert(expected=expected, actual=actual)


def test_create(post_minimal_query):
    request_data, response = post_minimal_query
    response_json = response.json()
    _deep_equality_assert(expected=request_data, actual=response_json)


def test_query_with_bad_base_table(get_uid, client):
    unexistant_base_table_id = 16135
    request_data = {
        "name": get_uid(),
        "base_table": unexistant_base_table_id,
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [[1, 3], [4, 5]],
                "alias": "alias_x",
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 400


def test_query_with_initial_column_without_id(create_patents_table, get_uid, client):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "name": get_uid(),
        "base_table": base_table.id,
        "initial_columns": [
            {
                "jp_path": [[1, 3], [4, 5]],
                "alias": "alias_x",
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 400


def test_query_with_initial_column_with_bad_jp_path(create_patents_table, get_uid, client):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "name": get_uid(),
        "base_table": base_table.id,
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [1],
                "alias": "alias_x",
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 400


def test_query_with_initial_column_without_alias(create_patents_table, get_uid, client):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "name": get_uid(),
        "base_table": base_table.id,
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [[1, 3], [4, 5]],
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 400


def test_query_with_initial_column_with_unexpected_key(create_patents_table, get_uid, client):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "name": get_uid(),
        "base_table": base_table.id,
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [[1, 3], [4, 5]],
                "alias": "alias_x",
                "bad_key": 1,
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 400


def test_query_with_with_unexpected_key(create_patents_table, get_uid, client):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "bad_key": 1,
        "name": get_uid(),
        "base_table": base_table.id,
        "initial_columns": [
            {
                "id": 1,
                "jp_path": [[1, 3], [4, 5]],
                "alias": "alias_x",
            },
            {
                "id": 2,
                "alias": "alias_y",
            },
        ],
    }
    response = client.post('/api/db/v0/queries/', data=request_data)
    assert response.status_code == 400


def test_update(post_minimal_query, client):
    post_data, response = post_minimal_query
    response_json = response.json()
    query_id = response_json['id']
    patch_data = {
        "initial_columns": [
            {
                "id": 3,
                "jp_path": [[1, 3]],
                "alias": "alias_x",
            }
        ]
    }
    response = client.patch(f'/api/db/v0/queries/{query_id}/', data=patch_data)
    response_json = response.json()
    expected = {}
    expected.update(post_data)
    expected.update(patch_data)
    _deep_equality_assert(expected=expected, actual=response_json)


def test_list(post_minimal_query, client):
    request_data, response = post_minimal_query
    response = client.get('/api/db/v0/queries/')
    response_json = response.json()
    assert response.status_code == 200
    actual = response_json['results']
    expected = [
        request_data,
    ]
    _deep_equality_assert(expected=expected, actual=actual)


def test_filter(post_minimal_query, client):
    request_data, response = post_minimal_query

    # check that filtering on the right schema_id works
    query = response.json()
    schema_id = query['schema']  # get schema_id from output_only field
    response = client.get(f'/api/db/v0/queries/?schema={schema_id}')
    assert response.status_code == 200
    expected = [
        request_data,
    ]
    actual = response.json()['results']
    _deep_equality_assert(expected=expected, actual=actual)

    # check that filtering on the wrong schema_id returns nothing
    wrong_schema_id = schema_id + 1
    response = client.get(f'/api/db/v0/queries/?schema={wrong_schema_id}')
    response_json = response.json()
    assert response.status_code == 200
    assert not response_json['results']


def test_get(post_minimal_query, client):
    request_data, response = post_minimal_query
    response_json = response.json()
    query_id = response_json['id']
    response = client.get(f'/api/db/v0/queries/{query_id}/')
    response_json = response.json()
    assert response.status_code == 200
    expected = request_data
    _deep_equality_assert(expected=expected, actual=response_json)


def test_delete(post_minimal_query, client):
    _, response = post_minimal_query
    response_json = response.json()
    query_id = response_json['id']
    response = client.delete(f'/api/db/v0/queries/{query_id}/')
    assert response.status_code == 204
    assert response.data is None


def _deep_equality_assert(
    expected,
    actual,
    key_path=[],  # for debugging
):
    """
    Recursively walks dicts and lists, checking that values in `expected` are present in and equal
    to those in `actual`. Note that dicts in `actual` can have keys not in `expected`, but can't
    have list elements that are not in `expected`.
    """
    if isinstance(expected, dict):
        for key in expected:
            assert key in actual
            _deep_equality_assert(
                key_path=key_path + [key],
                expected=expected[key],
                actual=actual[key],
            )
    elif isinstance(expected, list):
        assert len(actual) == len(expected)
        for i, _ in enumerate(expected):
            _deep_equality_assert(
                key_path=key_path + [i],
                expected=expected[i],
                actual=actual[i],
            )
    else:
        assert expected == actual
