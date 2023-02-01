import requests
from requests import ConnectionError

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar.api.exceptions.generic_exceptions.base_exceptions import NetworkException
from mathesar.api.exceptions.upgrade_exceptions.base_exceptions import UpgradeAPIException


class UpgradeViewSet(viewsets.ViewSet):

    @action(methods=['get'], detail=False)
    def start(self, _):
        try:
            response = _call_watchtower_update_scan()
            if response.ok:
                return Response(response.json(), status=response.status_code)
            else:
                return UpgradeAPIException(response)
        except ConnectionError as err:
            return NetworkException(err)


def _call_watchtower_update_scan():
    watchtower_hostname = "watchtower"
    url = f'http://{watchtower_hostname}/v1/update'
    authorization_token = "mytoken"
    headers = dict(
        Authorization=f"Bearer {authorization_token}"
    )
    response = requests.get(url, headers=headers)
    return response
