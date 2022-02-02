from rest_framework import viewsets
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist

#from mathesar.filters.operations.check_support import get_supported_filters

from mathesar.api.serializers.filters import FilterSerializer
from mathesar.models import Database

# TODO abstract away the database acquiry into a helper method that this and other viewsets can
# import.

class FiltersViewSet(viewsets.ViewSet):
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
        #supported_filters = get_supported_filters(engine)
        #serializer = FilterSerializer(supported_filters, many=True)
        #return Response(serializer.data)
        return None
