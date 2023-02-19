from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.base import Database
from mathesar.models.users import DatabaseRole, Role


class DatabaseRoleAccessPolicy(AccessPolicy):
    statements = [
        # Listing and retrieving a database role is allowed for everyone.
        # We cannot restrict access for creating a `DatabaseRole` object here,
        # because the database for which the role is created can be known only by inspecting the request body.
        # So creating a database role API access permission is tied to
        # the validation done on the database object (sent in the body) by the serializer
        # when creating the database role.
        {
            'action': ['list', 'retrieve', 'create'],
            'principal': 'authenticated',
            'effect': 'allow',
        },
        # Only superuser or database manager can delete the database role
        {
            'action': ['destroy', 'update', 'partial_update'],
            'principal': ['authenticated'],
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_db_manager)']
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not (request.user.is_superuser or request.user.is_anonymous):
            # TODO Consider moving to more reusable place
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
            databases_with_view_access = Database.objects.filter(
                Q(database_role__role__in=allowed_roles) & Q(database_role__user=request.user)
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
