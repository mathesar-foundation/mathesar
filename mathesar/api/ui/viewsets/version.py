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
        return Response(current_version)

    @action(methods=['get'], detail=False)
    def latest(self, _):
        latest_version = _get_latest_release_tag_name_from_github()
        return Response(latest_version)


def _get_latest_release_tag_name_from_github():
    """
    If Github API returns a non-200 response, will raise and exception with the status code and
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
        tag_name = json['tag_name']
        return tag_name
    else:
        status = response.status_code
        message = f"Github Releases API returned a {status} response."
        raise GithubReleasesAPIException(
            Exception(),
            status_code=status,
            message=message,
            details=response.json(),
        )
