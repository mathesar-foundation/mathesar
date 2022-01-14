from rest_framework import viewsets
from rest_framework.response import Response
from mathesar.database.functions.base import supported_db_functions
from mathesar.api.serializers.functions import DbFunctionSerializer

class DbFunctionViewSet(viewsets.ViewSet):
    def list(self, _):
        serializer = DbFunctionSerializer(supported_db_functions, many=True)
        return Response(serializer.data)
