from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import DatabaseRole, Role, SchemaRole


class TableSettingAccessPolicy(AccessPolicy):
    # Anyone can view a Table Setting as long as they have
    # at least a Viewer access to the schema or its database
    # Create Access is restricted to superusers or managers of the schema or the database.
    statements = [
        {
            'action': ['list', 'retrieve', 'create'],
            'principal': 'authenticated',
            'effect': 'allow',
        },
        # Only superuser or schema/database manager can delete the setting
        {
            'action': ['destroy', 'update', 'partial_update'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_table_editor)']
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not (request.user.is_superuser or request.user.is_anonymous):
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value,)
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

    def is_table_editor(self, request, view, action):
        # Column access control is based on Schema and Database Roles as of now
        # TODO Include Table Role based access when Table Roles are introduced
        setting = view.get_object()
        editor_permission_roles = (Role.MANAGER.value, Role.EDITOR.value)
        is_schema_manager = SchemaRole.objects.filter(
            user=request.user,
            schema=setting.table.schema,
            role__in=editor_permission_roles
        ).exists()
        is_db_manager = DatabaseRole.objects.filter(
            user=request.user,
            database=setting.table.schema.database,
            role__in=editor_permission_roles
        ).exists()
        return is_db_manager or is_schema_manager
