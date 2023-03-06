from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar import __version__


class VersionViewSet(viewsets.ViewSet):

    @action(methods=['get'], detail=False)
    def current(self, _):
        return Response(__version__)
