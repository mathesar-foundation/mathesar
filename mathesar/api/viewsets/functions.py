from rest_framework import viewsets
from rest_framework.response import Response
from db.functions.base import supported_db_functions
from mathesar.api.serializers.functions import DBFunctionSerializer


class DBFunctionViewSet(viewsets.ViewSet):
    def list(self, _):
        serializer = DBFunctionSerializer(supported_db_functions, many=True)
        return Response(serializer.data)
