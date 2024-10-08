import json
from django_filters import rest_framework as filters
from rest_access_policy import AccessViewSetMixin

from rest_framework import viewsets
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import action

from mathesar.api.db.permissions.query import QueryAccessPolicy
from mathesar.api.dj_filters import ExplorationFilter

from mathesar.api.exceptions.query_exceptions.exceptions import DeletedColumnAccess, DeletedColumnAccessAPIException
from mathesar.api.pagination import DefaultLimitOffsetPagination, TableLimitOffsetPagination
from mathesar.api.serializers.queries import BaseQuerySerializer, QuerySerializer
from mathesar.models.query import Exploration


class QueryViewSet(
        AccessViewSetMixin,
        CreateModelMixin,
        UpdateModelMixin,
        RetrieveModelMixin,
        ListModelMixin,
        DestroyModelMixin,
        viewsets.GenericViewSet
):
    serializer_class = QuerySerializer
    pagination_class = DefaultLimitOffsetPagination
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = ExplorationFilter
    permission_classes = [IsAuthenticatedOrReadOnly]
    access_policy = QueryAccessPolicy

    def get_queryset(self):
        queryset = self._get_scoped_queryset()
        schema_id = self.request.query_params.get('schema')
        if schema_id:
            queryset = queryset.filter(base_table__schema=schema_id)
        return queryset.order_by('-created_at')

    def _get_scoped_queryset(self):
        """
        Returns a properly scoped queryset.

        Access to queries may require different access controls, some of which
        include scoping while others do not. See
        `QueryAccessPolicy.get_should_queryset_be_unscoped` docstring for more
        information.
        """
        should_queryset_be_scoped = \
            not QueryAccessPolicy.get_should_queryset_be_unscoped(self.action)
        if should_queryset_be_scoped:
            queryset = self.access_policy.scope_queryset(
                self.request,
                Exploration.objects.all()
            )
        else:
            queryset = Exploration.objects.all()
        return queryset

    @action(methods=['get'], detail=True)
    def columns(self, request, pk=None):
        query = self.get_object()
        output_col_desc = query.output_columns_described
        return Response(output_col_desc)
