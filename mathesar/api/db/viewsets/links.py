from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.viewsets import GenericViewSet
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.links import LinksMappingSerializer


class LinkViewSet(CreateModelMixin, ListModelMixin, GenericViewSet):
    serializer_class = LinksMappingSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return []
