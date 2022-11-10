from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.base import Database, Schema
from mathesar.models.users import DatabaseRole, Role, SchemaRole


class SchemaRoleAccessPolicy(AccessPolicy):
    # Anyone can view schema role as long as they have atleast a view access to that schema or its database
    # Create Access is restricted to superusers or managers of the schema or the database it belongs to.
    statements = [
        {
            'action': ['list', 'retrieve', 'create'],
            'principal': '*',
            'effect': 'allow',
        },
        # Only superuser or schema/database manager can delete the role
        {
            'action': ['destroy', 'update', 'partial_update'],
            'principal': ['*'],
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_schema_manager)']
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not request.user.is_superuser:
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
            databases_with_view_access = Database.objects.filter(
                Q(databaserole__role__in=allowed_roles) & Q(databaserole__user=request.user)
            )
            schema_with_view_access = Schema.objects.filter(
                Q(schemarole__role__in=allowed_roles) & Q(schemarole__user=request.user)
            )
            qs = qs.filter(
                Q(schema__in=schema_with_view_access)
                | Q(schema__database__in=databases_with_view_access)
            )
        return qs

    def is_schema_manager(self, request, view, action):
        schema_role = view.get_object()
        is_schema_manager = SchemaRole.objects.filter(
            user=request.user,
            schema=schema_role.schema,
            role=Role.MANAGER.value
        ).exists()
        is_db_manager = DatabaseRole.objects.filter(
            user=request.user,
            schema=schema_role.schema,
            role=Role.MANAGER.value
        ).exists()
        return is_db_manager or is_schema_manager
