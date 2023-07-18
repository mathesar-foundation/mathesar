from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class ColumnAccessPolicy(AccessPolicy):
    """
    Anyone can view a Column as long as they have
    at least a Viewer access to the Schema or the database
    Only superuser or schema/database manager can delete/modify/create a Column
    """

    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': 'is_atleast_viewer_nested_table_resource'
        },
        {
            'action': ['dependents'],
            'principal': 'authenticated',
            'effect': 'allow',
        },
        {
            'action': ['destroy', 'update', 'partial_update', 'create'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_manager_nested_table_resource'
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not (request.user.is_superuser or request.user.is_anonymous):
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
            permissible_database_role_filter = (
                Q(table__schema__database__database_role__role__in=allowed_roles)
                & Q(table__schema__database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (
                Q(table__schema__schema_role__role__in=allowed_roles)
                & Q(table__schema__schema_role__user=request.user)
            )
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)

        return qs
