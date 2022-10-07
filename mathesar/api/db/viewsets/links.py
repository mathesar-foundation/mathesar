from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.viewsets import GenericViewSet
from mathesar.api.pagination import DefaultLimitOffsetPagination
from mathesar.api.serializers.links import LinksMappingSerializer
from mathesar.state import reset_reflection


class LinkViewSet(CreateModelMixin, ListModelMixin, GenericViewSet):
    serializer_class = LinksMappingSerializer
    pagination_class = DefaultLimitOffsetPagination

    def get_queryset(self):
        return []

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        reset_reflection()
        return response
