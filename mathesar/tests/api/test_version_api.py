import pytest
import responses
from frozendict import frozendict
import mathesar


@pytest.fixture
def hardcoded_version(monkeypatch):
    mock_hardcoded_version = "v0.1.2-fake"
    monkeypatch.setattr(mathesar, "__version__", mock_hardcoded_version)
    return mock_hardcoded_version


# As seen in https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#get-a-release
# but, heavily redacted to take up less space
mock_release_info_json = frozendict(
    {
        "url": "https://api.github.com/repos/octocat/Hello-World/releases/1",
        "html_url": "https://github.com/octocat/Hello-World/releases/v1.0.0",
        "id": 1,
        "tag_name": "v1.0.0",
        "name": "v1.0.0",
        "body": "Description of the release",
        "draft": False,
        "prerelease": False,
        "created_at": "2013-02-27T19:35:32Z",
        "published_at": "2013-02-27T19:35:32Z",
    }
)


def test_latest_release_endpoint_200(mocked_responses, client):
    mocked_responses.get(
        url='https://api.github.com/repos/centerofci/mathesar/releases/latest',
        json=mock_release_info_json,
        status=200,
    )
    response = client.get('/api/ui/v0/version/latest/')
    json = response.json()
    assert response.status_code == 200
    assert json == mock_release_info_json


def test_latest_release_endpoint_404(mocked_responses, client):
    mocked_responses.get(
        url='https://api.github.com/repos/centerofci/mathesar/releases/latest',
        status=404,
    )
    response = client.get('/api/ui/v0/version/latest/')
    assert response.status_code == 404


def test_installed_release_endpoint_200(
    mocked_responses, client, hardcoded_version
):
    tag_name = hardcoded_version
    mocked_responses.get(
        url=f'https://api.github.com/repos/centerofci/mathesar/releases/tags/{tag_name}',
        json=mock_release_info_json,
        status=200,
    )
    response = client.get('/api/ui/v0/version/current/')
    json = response.json()
    assert response.status_code == 200
    assert json == mock_release_info_json


def test_installed_release_endpoint_404(
    mocked_responses, client, hardcoded_version
):
    tag_name = hardcoded_version
    mocked_responses.get(
        url=f'https://api.github.com/repos/centerofci/mathesar/releases/tags/{tag_name}',
        status=404,
    )
    response = client.get('/api/ui/v0/version/current/')
    json = response.json()
    assert response.status_code == 404
    release_info_with_only_tag_name = dict(tag_name=hardcoded_version)
    assert json == release_info_with_only_tag_name
