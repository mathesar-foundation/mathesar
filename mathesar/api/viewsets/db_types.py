from django.core.exceptions import ObjectDoesNotExist

from rest_framework import viewsets
from rest_framework.response import Response

from db.types.base import get_available_known_db_types

from mathesar.api.serializers.db_types import DBTypeSerializer

from mathesar.models import Database


class DBTypeViewSet(viewsets.ViewSet):
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
        available_known_db_types = get_available_known_db_types(engine)
        serializer = DBTypeSerializer(available_known_db_types, many=True)
        return Response(serializer.data)
