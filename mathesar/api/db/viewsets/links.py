from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.links import LinksMappingSerializer


class LinkViewSet(CreateModelMixin, GenericViewSet):
    serializer_class = LinksMappingSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return []

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        return response
