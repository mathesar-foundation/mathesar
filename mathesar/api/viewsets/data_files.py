from rest_framework import status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.response import Response

from mathesar.errors import InvalidTableError
from mathesar.models import DataFile
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.data_files import DataFileSerializer
from mathesar.utils.datafiles import create_datafile


class DataFileViewSet(viewsets.GenericViewSet, ListModelMixin, RetrieveModelMixin, CreateModelMixin):
    queryset = DataFile.objects.all().order_by('-created_at')
    serializer_class = DataFileSerializer
    pagination_class = DefaultLimitOffsetPagination

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
            return Response(
                {'detail': 'Method "PATCH" allowed only for header.'},
                status=status.HTTP_405_METHOD_NOT_ALLOWED
            )

    def create(self, request):
        serializer = DataFileSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        try:
            datafile = create_datafile(serializer.validated_data)
        except InvalidTableError:
            raise ValidationError('Unable to tabulate data')
        serializer = DataFileSerializer(datafile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
