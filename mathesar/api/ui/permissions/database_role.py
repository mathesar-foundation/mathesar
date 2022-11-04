from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.base import Database
from mathesar.models.users import DatabaseRole, Role


class DatabaseRoleAccessPolicy(AccessPolicy):
    statements = [
        # Creating a database role is allowed for everyone
        {
            'action': ['list', 'retrieve', 'create'],
            'principal': '*',
            'effect': 'allow',
        },
        # Only superuser can assign a database role
        {
            'action': ['destroy', 'partial_update', 'update'],
            'principal': ['*'],
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_db_manager)']
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not request.user.is_superuser:
            # TODO Consider moving to more reusable place
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
            databases_with_view_access = Database.objects.filter(
                Q(databaserole__role__in=allowed_roles) & Q(databaserole__user=request.user)
            )
            qs = qs.filter(database__in=databases_with_view_access)
        return qs

    def is_db_manager(self, request, view, action):
        database_role = view.get_object()
        return DatabaseRole.objects.filter(
            user=request.user,
            database=database_role.database,
            role=Role.MANAGER.value
        ).exists()
