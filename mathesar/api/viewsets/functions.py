from rest_framework import viewsets
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist

from db.functions.operations.check_support import get_supported_db_functions

from mathesar.api.serializers.functions import DBFunctionSerializer
from mathesar.models import Database


class DBFunctionViewSet(viewsets.ViewSet):
    def list(self, request):
        try:
            db_name = request.query_params['db_name']
        except KeyError as e:
            raise Exception('db_name query parameter must be provided.') from e
        try:
            db_model = Database.objects.get(name=db_name)
        except ObjectDoesNotExist as e:
            raise Exception({"database": f"Database '{db_name}' not found"}) from e
        engine = db_model._sa_engine
        supported_db_functions = get_supported_db_functions(engine)
        serializer = DBFunctionSerializer(supported_db_functions, many=True)
        return Response(serializer.data)
