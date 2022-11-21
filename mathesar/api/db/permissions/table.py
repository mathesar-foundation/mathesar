from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import DatabaseRole, Role, SchemaRole


class TableAccessPolicy(AccessPolicy):
    # Anyone can view table role as long as they have
    # at least a Viewer access to the schema or its database
    # Create Access is restricted to superusers or managers of the schema or the database the table is part of.
    statements = [
        {
            'action': ['list', 'retrieve', 'create', 'type_suggestions'],
            'principal': '*',
            'effect': 'allow',
        },
        # Only superuser or schema/database manager can delete the role
        {
            'action': ['destroy', 'update', 'partial_update', 'split_table', 'move_columns', 'previews', 'existing_import', 'map_imported_columns'],
            'principal': ['*'],
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_table_manager)']
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not request.user.is_superuser:
            allowed_roles = (Role.MANAGER.value,)

            if request.method.lower() == 'get':
                allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
            permissible_database_role_filter = (
                Q(table__schema__database__databaserole__role__in=allowed_roles) & Q(table__schema__database__databaserole__user=request.user)
            )
            permissible_schema_roles_filter = (Q(table__schema__schemarole__role__in=allowed_roles) & Q(table__schema__schemarole__user=request.user))
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)

        return qs

    def is_table_manager(self, request, view, action):
        # Table access control is based on Schema and Database Roles as of now
        # TODO Include Table Role based access when Table Roles are introduced
        table = view.get_object()
        is_schema_manager = SchemaRole.objects.filter(
            user=request.user,
            schema=table.schema,
            role=Role.MANAGER.value
        ).exists()
        is_db_manager = DatabaseRole.objects.filter(
            user=request.user,
            database=table.schema.database,
            role=Role.MANAGER.value
        ).exists()
        return is_db_manager or is_schema_manager
