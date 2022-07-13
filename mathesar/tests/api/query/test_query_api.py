import pytest


@pytest.fixture
def post_empty_query(_post_query):
    request_data = {}
    return _post_query(request_data)


@pytest.fixture
def post_minimal_query(_post_query, create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    request_data = {
        "base_table": base_table.id,
        # TODO use actual columns
        "initial_columns": [
            {
                "column": 1,
                "jp_path": [[1, 3], [4, 5]],
            },
            {
                "column": 2,
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


def test_create_empty(post_empty_query):
    request_data, response = post_empty_query
    response_json = response.json()
    _deep_equality_assert(expected=request_data, actual=response_json)


def test_create(post_minimal_query):
    request_data, response = post_minimal_query
    response_json = response.json()
    _deep_equality_assert(expected=request_data, actual=response_json)


def test_update(post_minimal_query, client):
    post_data, response = post_minimal_query
    response_json = response.json()
    query_id = response_json['id']
    patch_data = {
        "initial_columns": [
            {
                "column": 3,
                "jp_path": [[1, 3]],
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
