from rest_access_policy import AccessPolicy

from mathesar.api.utils import get_table_or_404, get_query_or_404
from mathesar.api.permission_utils import TableAccessInspector, QueryAccessInspector


class SharedTableAccessPolicy(AccessPolicy):
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_table_viewer'
        },
        {
            'action': ['create', 'destroy', 'update', 'partial_update'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_table_manager'
        },
    ]

    def is_atleast_table_viewer(self, request, view, action):
        table = get_table_or_404(view.kwargs['table_pk'])
        return TableAccessInspector(request.user, table).is_atleast_viewer()

    def is_atleast_table_manager(self, request, view, action):
        table = get_table_or_404(view.kwargs['table_pk'])
        return TableAccessInspector(request.user, table).is_atleast_manager()


class SharedQueryAccessPolicy(AccessPolicy):
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_query_viewer'
        },
        {
            'action': ['create', 'destroy', 'update', 'partial_update'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_query_editor'
        },
    ]

    def is_atleast_query_viewer(self, request, view, action):
        query = get_query_or_404(view.kwargs['query_pk'])
        return QueryAccessInspector(request.user, query).is_atleast_viewer()

    def is_atleast_query_editor(self, request, view, action):
        query = get_query_or_404(view.kwargs['query_pk'])
        return QueryAccessInspector(request.user, query).is_atleast_editor()
