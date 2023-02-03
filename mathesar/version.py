import requests
from requests import ConnectionError

import mathesar
# TODO this import path is pretty long; might want to remove redundant occurances of "_exceptions"
from mathesar.api.exceptions.version_exceptions.base_exceptions import GithubReleasesAPIException
from mathesar.api.exceptions.generic_exceptions.base_exceptions import NetworkException


def get_cached_version_info():
    """
    Like `block_for_version_info`, but only accesses the cache: does not block.
    """
    current_release_info = _get_cached_current_release_info()
    latest_release_info = _get_cached_latest_release_info()
    return _build_version_info(current_release_info, latest_release_info)


def populate_version_info_cache():
    block_for_version_info()


def block_for_version_info():
    """
    Makes blocking HTTP calls to retrieve release information about the current
    and latest releases.

    See `_build_version_info` for what the resulting structure looks like.

    See Github Releases API [0] for what format `current_release` and
    `latest_release` sub-structures are expected to have.

    See `_block_for_release_info_by_tag_name` for why `current_release` might
    only have the `tag_name` key-value pair.

    [0] https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28
    """
    current_release_info, _ = block_for_current_release_info()
    try:
        latest_release_info = block_for_latest_release_info()
    except (NetworkException, GithubReleasesAPIException) as _:  # noqa: F841
        latest_release_info = None
    return _build_version_info(current_release_info, latest_release_info)


def _build_version_info(current_release_info, latest_release_info):
    is_update_available = _is_same_version(
        current_release_info,
        latest_release_info,
    )
    return dict(
        current_release=current_release_info,
        latest_release=latest_release_info,
        is_update_available=is_update_available,
    )


def _is_same_version(release_info1, release_info2):
    if release_info1 and release_info2:
        tag_name1 = release_info1.get('tag_name')
        tag_name2 = release_info2.get('tag_name')
        if tag_name1 and tag_name2:
            return tag_name1 == tag_name2


def block_for_current_release_info():
    current_version = _get_current_version_string()
    release_info, status_code = _block_for_release_info_by_tag_name(
        current_version
    )
    _set_cached_current_release_info(release_info)
    return (release_info, status_code)


def _get_current_version_string():
    return mathesar.__version__


def _block_for_release_info_by_tag_name(tag_name):
    """
    Returns a tuple of (release info json, github api response status code). The resulting response
    is meant to use Github API's response code.

    Will not panic in case of failure querying Github's APIs, because we can still provide the
    version/tag_name.
    """
    def release_info_with_only_the_tag_name():
        """
        Follows the same json schema as returned by GH, except that only the tag_name key is set.
        """
        return dict(tag_name=tag_name)
    url = f'{_release_api_base_url}/tags/{tag_name}'
    try:
        response = requests.get(url, _github_request_headers)
    except ConnectionError:
        return (release_info_with_only_the_tag_name(), 503)
    if response.ok:
        release_info = response.json()
        return (release_info, 200)
    else:
        return (release_info_with_only_the_tag_name(), response.status_code)


def block_for_latest_release_info():
    """
    If Github API returns a non-200 response, will raise an exception with the status code and
    body of Github API's response.
    """
    url = f'{_release_api_base_url}/latest'
    try:
        response = requests.get(url, _github_request_headers)
    except ConnectionError as e:
        raise NetworkException(e)
    if response.ok:
        release_info = response.json()
        _set_cached_latest_release_info(release_info)
        return release_info
    else:
        raise GithubReleasesAPIException(response)


def _get_cached_current_release_info():
    return _cached_current_release_info


def _set_cached_current_release_info(release_info):
    _cached_current_release_info = release_info
    return _cached_current_release_info


_cached_current_release_info = None


def _get_cached_latest_release_info():
    return _cached_latest_release_info


def _set_cached_latest_release_info(release_info):
    _cached_latest_release_info = release_info
    return _cached_latest_release_info


_cached_latest_release_info = None


_repo_owner = 'centerofci'
_repo = 'mathesar'
_release_api_base_url = f'https://api.github.com/repos/{_repo_owner}/{_repo}/releases'
_github_request_headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
}
