import requests

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar import __version__
# TODO this import path is pretty long; might want to remove redundant occurances of "_exceptions"
from mathesar.api.exceptions.version_exceptions.base_exceptions import GithubReleasesAPIException


class VersionViewSet(viewsets.ViewSet):

    @action(methods=['get'], detail=False)
    def current(self, _):
        current_version = __version__
        release_info = _get_release_info_from_github_by_tag_name(
            current_version
        )
        if release_info:
            return Response(release_info)
        else:
            return dummy_release_info_with_just_the_tag_name(
                current_version
            )


    @action(methods=['get'], detail=False)
    def latest(self, _):
        latest_version = _get_latest_release_info_from_github()
        return Response(latest_version)


def dummy_release_info_with_just_the_tag_name(tag_name):
    """
    If we can't provide a release description from Github, we'll sometimes still be able to
    provide the version/tag.
    """
    return dict(tag_name=tag_name)


def _get_release_info_from_github_by_tag_name(tag_name):
    """
    Will return None, if release with this tag name is not found, or if the HTTP request failed
    for some other reason (e.g. client or Github offline).

    Will not panic in case of failure querying Github's APIs, because we can still provide the
    version/tag string.
    """
    owner = 'centerofci'
    repo = 'mathesar'
    url = f'https://api.github.com/repos/{owner}/{repo}/releases/tags/{tag_name}'
    headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    response = requests.get(url, headers)
    if response.ok:
        json = response.json()
        return json
    else:
        return None


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
    response = requests.get(url, headers)
    if response.ok:
        json = response.json()
        return json
    else:
        status = response.status_code
        message = f"Github Releases API returned a {status} response."
        raise GithubReleasesAPIException(
            Exception(),
            status_code=status,
            message=message,
            details=response.json(),
        )
