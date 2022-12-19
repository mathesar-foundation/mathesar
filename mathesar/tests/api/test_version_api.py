import pytest
import responses


@pytest.fixture
def mocked_responses():
    """
    https://github.com/getsentry/responses#responses-as-a-pytest-fixture
    """
    with responses.RequestsMock() as rsps:
        yield rsps


@pytest.fixture
def stubbed_latest_releases_api_tag_name(mocked_responses):
    stubbed_tag_name = "1.0.0-faketag"
    stubbed_response_json = {
        "tag_name": stubbed_tag_name,
    }
    stubbed_response = responses.Response(
        method=responses.GET,
        url='https://api.github.com/repos/centerofci/mathesar/releases/latest',
        json=stubbed_response_json,
        status=200,
    )
    mocked_responses.add(stubbed_response)
    return stubbed_tag_name


@pytest.fixture
def stubbed_latest_releases_api_404(mocked_responses):
    stubbed_response = responses.Response(
        method=responses.GET,
        url='https://api.github.com/repos/centerofci/mathesar/releases/latest',
        json={},
        status=404,
    )
    mocked_responses.add(stubbed_response)


def test_latest_release_endpoint(stubbed_latest_releases_api_tag_name, client):
    response = client.get('/api/ui/v0/version/latest/')
    text = response.json()
    assert response.status_code == 200
    assert text == stubbed_latest_releases_api_tag_name


def test_latest_release_endpoint_failing(stubbed_latest_releases_api_404, client):
    response = client.get('/api/ui/v0/version/latest/')
    assert response.status_code == 404
