import uuid
from rest_framework import viewsets
from rest_access_policy import AccessViewSetMixin
from rest_framework.decorators import action
from rest_framework.response import Response

from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.ui.serializers.shares import SharedTableSerializer, SharedQuerySerializer
from mathesar.api.ui.permissions.shares import SharedTableAccessPolicy, SharedQueryAccessPolicy
from mathesar.models.shares import SharedTable, SharedQuery


class RegenerateSlugMixin(viewsets.GenericViewSet):
    @action(methods=['post'], detail=True)
    def regenerate(self, *args, **kwargs):
        share = self.get_object()
        share.slug = uuid.uuid4()
        share.save()
        serializer = self.get_serializer(share)
        return Response(serializer.data)


class SharedTableViewSet(AccessViewSetMixin, viewsets.ModelViewSet, RegenerateSlugMixin):
    pagination_class = DefaultLimitOffsetPagination
    serializer_class = SharedTableSerializer
    access_policy = SharedTableAccessPolicy

    def get_queryset(self):
        return SharedTable.objects.filter(table_id=self.kwargs['table_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(table_id=self.kwargs['table_pk'])


class SharedQueryViewSet(AccessViewSetMixin, viewsets.ModelViewSet, RegenerateSlugMixin):
    pagination_class = DefaultLimitOffsetPagination
    serializer_class = SharedQuerySerializer
    access_policy = SharedQueryAccessPolicy

    def get_queryset(self):
        return SharedQuery.objects.filter(query_id=self.kwargs['query_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(query_id=self.kwargs['query_pk'])
