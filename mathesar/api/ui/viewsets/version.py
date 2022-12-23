import requests
from requests import ConnectionError

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar import __version__
# TODO this import path is pretty long; might want to remove redundant occurances of "_exceptions"
from mathesar.api.exceptions.version_exceptions.base_exceptions import GithubReleasesAPIException
from mathesar.api.exceptions.generic_exceptions.base_exceptions import NetworkException


class VersionViewSet(viewsets.ViewSet):

    @action(methods=['get'], detail=False)
    def current(self, _):
        current_version = __version__
        release_info, status_code = _get_release_info_from_github_by_tag_name(
            current_version
        )
        return Response(release_info, status=status_code)

    @action(methods=['get'], detail=False)
    def latest(self, _):
        latest_version = _get_latest_release_info_from_github()
        return Response(latest_version)


def _get_release_info_from_github_by_tag_name(tag_name):
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
    owner = 'centerofci'
    repo = 'mathesar'
    url = f'https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag_name}'
    headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    try:
        response = requests.get(url, headers)
    except ConnectionError:
        return (release_info_with_only_the_tag_name(), 503)
    if response.ok:
        release_info = response.json()
        return (release_info, 200)
    else:
        return (release_info_with_only_the_tag_name(), response.status_code)


def _get_latest_release_info_from_github():
    """
    If Github API returns a non-200 response, will raise an exception with the status code and
    body of Github API's response.
    """
    owner = 'centerofci'
    repo = 'mathesar'
    url = f'https://api.github.com/repos/{owner}/{repo}/releases/latest'
    headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    try:
        response = requests.get(url, headers)
    except ConnectionError as e:
        raise NetworkException(e)
    if response.ok:
        json = response.json()
        return json
    else:
        raise GithubReleasesAPIException(response)
