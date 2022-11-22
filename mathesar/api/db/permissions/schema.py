from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import DatabaseRole, Role, SchemaRole


class SchemaAccessPolicy(AccessPolicy):
    # Anyone can view a Schema as long as they have
    # at least a Viewer access to that schema or the database the schema is part of
    # Create access is restricted to superusers or managers of the schema or the database the schema is part of.
    statements = [
        {
            'action': ['list', 'retrieve', 'create'],
            'principal': '*',
            'effect': 'allow',
        },
        # Only superuser or schema/database manager can modify or delete the schema
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
            allowed_roles = (Role.MANAGER.value,)

            if request.method.lower() == 'get':
                allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
            permissible_database_role_filter = (
                Q(database__database_role__role__in=allowed_roles) & Q(database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (Q(schema_role__role__in=allowed_roles) & Q(schema_role__user=request.user))
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)
        return qs

    def is_schema_manager(self, request, view, action):
        schema = view.get_object()
        is_schema_manager = SchemaRole.objects.filter(
            user=request.user,
            schema=schema,
            role=Role.MANAGER.value
        ).exists()
        is_db_manager = DatabaseRole.objects.filter(
            user=request.user,
            database=schema.database,
            role=Role.MANAGER.value
        ).exists()
        return is_db_manager or is_schema_manager
