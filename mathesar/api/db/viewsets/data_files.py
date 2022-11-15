from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.api.dj_filters import DataFileFilter
import mathesar.api.exceptions.data_import_exceptions.exceptions
import mathesar.api.exceptions.database_exceptions.exceptions
import mathesar.api.exceptions.generic_exceptions.base_exceptions as base_api_exceptions
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.errors import InvalidTableError
from mathesar.models.base import DataFile
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.data_files import DataFileSerializer
from mathesar.utils.datafiles import create_datafile


class DataFileViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin, CreateModelMixin):
    queryset = DataFile.objects.all().order_by('-created_at')
    serializer_class = DataFileSerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = DataFileFilter

    def partial_update(self, request, pk=None):
        serializer = DataFileSerializer(
            data=request.data, context={'request': request}, partial=True
        )
        serializer.is_valid(raise_exception=True)

        data_file = self.get_object()
        if serializer.validated_data.get('header') is not None:
            data_file.header = serializer.validated_data['header']
            data_file.save()
            serializer = DataFileSerializer(data_file, context={'request': request})
            return Response(serializer.data)
        else:
            exception_body = base_api_exceptions.ErrorBody(
                code=ErrorCodes.MethodNotAllowed.value,
                message='Method "PATCH" allowed only for header.'
            )
            raise base_api_exceptions.GenericAPIException(
                [exception_body],
                status.HTTP_405_METHOD_NOT_ALLOWED
            )

    def create(self, request, *args, **kwargs):
        serializer = DataFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        try:
            datafile = create_datafile(serializer.validated_data)
        except InvalidTableError as e:
            raise mathesar.api.exceptions.data_import_exceptions.exceptions.InvalidTableAPIException(e, status_code=status.HTTP_400_BAD_REQUEST)
        serializer = DataFileSerializer(datafile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
