from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class QueryAccessPolicy(AccessPolicy):

    statements = [
        {
            # Restrictions for the create method is done by the Serializers when creating the query,
            # As the permissions depend on the base_table object and not on the query object.
            'action': [
                'list',
                'retrieve',
                'destroy',
                'create',
                'run',
                'update',
                'partial_update',
                'columns',
                'results',
                'records',

            ],
            'principal': 'authenticated',
            'effect': 'allow',
        },
    ]

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
