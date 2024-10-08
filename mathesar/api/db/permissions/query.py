from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.api.permission_utils import QueryAccessInspector
from mathesar.models.users import Role

_statement_for_retrieving_single_queries = {
    'action': [
        'retrieve',
        'results',
    ],
    'principal': '*',
    'effect': 'allow',
    'condition_expression': 'is_atleast_query_viewer'
}

_statement_for_other_actions = {
    # Restrictions for the create method is done by the Serializers when creating the query,
    # As the permissions depend on the base_table object and not on the query object.
    'action': [
        'list',
        'destroy',
        'create',
        'run',
        'update',
        'partial_update',
        'columns',
        'records',

    ],
    'principal': 'authenticated',
    'effect': 'allow',
}


class QueryAccessPolicy(AccessPolicy):

    statements = [
        _statement_for_retrieving_single_queries,
        _statement_for_other_actions
    ]

    @staticmethod
    def get_should_queryset_be_unscoped(viewset_action):
        """
        Tells you if the queryset for passed viewset action should be scoped
        using this class's `scope_queryset`.

        For purposes of access control, we split viewset actions (e.g. 'retrieve')
        into those that are for retrieving single queries and the rest. The reason
        is that single query retrieval might be performed anonymously, which
        requires different access controls.

        More specifically, access during possibly-anonymous query retrieval is
        controlled via `is_atleast_query_viewer`. While, for the rest of the
        actions, access is controlled via `QueryAccessPolicy.scope_queryset`.
        This is defined in `QueryAccessPolicy.statements`.

        Note, it is essential to handle action being `None` here, because it's
        called again by `filter_queryset` with action `None` after the query is
        formed.
        """
        return (
            _get_is_action_for_retrieving_single_query(viewset_action)
            or viewset_action is None
        )

    @classmethod
    def scope_queryset(cls, request, qs):
        if not (request.user.is_superuser or request.user.is_anonymous):
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
            permissible_database_role_filter = (
                Q(base_table__schema__database__database_role__role__in=allowed_roles)
                & Q(base_table__schema__database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (
                Q(base_table__schema__schema_role__role__in=allowed_roles)
                & Q(base_table__schema__schema_role__user=request.user)
            )
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)
        return qs


def _get_is_action_for_retrieving_single_query(action):
    return action in _statement_for_retrieving_single_queries['action']
