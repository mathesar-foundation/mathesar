from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar.version import block_for_current_release_info, block_for_latest_release_info


class VersionViewSet(viewsets.ViewSet):

    @action(methods=['get'], detail=False)
    def current(self, _):
        release_info, status_code = block_for_current_release_info()
        return Response(release_info, status=status_code)

    @action(methods=['get'], detail=False)
    def latest(self, _):
        latest_version = block_for_latest_release_info()
        return Response(latest_version)
