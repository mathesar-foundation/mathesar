import requests
from requests import ConnectionError

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar.api.exceptions.generic_exceptions.base_exceptions import NetworkException
from mathesar.api.exceptions.upgrade_exceptions.base_exceptions import UpgradeAPIException


update_companion_url = 'http://mathesar-update-companion'


class UpgradeViewSet(viewsets.ViewSet):

    @action(methods=['get'], detail=False)
    def start(self, request):
        version = request.query_params.get('version')
        try:
            url = f'{update_companion_url}/start'
            if version:
                url = f'{url}/{version}'
            response = requests.get(url)
            if response.ok:
                return Response(response.json(), status=response.status_code)
            else:
                return UpgradeAPIException(response)
        except ConnectionError as err:
            return NetworkException(err)

    @action(methods=['get'], detail=False)
    def progress(self, request):
        upgradeId = request.query_params.get('upgradeId')
        try:
            url = f'{update_companion_url}/progress'
            if upgradeId:
                url = f'{url}/{upgradeId}'
            response = requests.get(url)
            return Response(response.json(), status=response.status_code)
        except ConnectionError as err:
            return NetworkException(err)
