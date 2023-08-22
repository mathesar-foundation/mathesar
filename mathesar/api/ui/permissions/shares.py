from rest_access_policy import AccessPolicy

from mathesar.api.utils import get_query_or_404
from mathesar.api.permission_utils import QueryAccessInspector


class SharedTableAccessPolicy(AccessPolicy):
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_viewer_nested_table_resource'
        },
        {
            'action': ['create', 'destroy', 'update', 'partial_update', 'regenerate'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_editor_nested_table_resource'
        },
    ]


class SharedQueryAccessPolicy(AccessPolicy):
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_query_viewer'
        },
        {
            'action': ['create', 'destroy', 'update', 'partial_update', 'regenerate'],
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
