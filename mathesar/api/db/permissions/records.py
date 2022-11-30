from rest_access_policy import AccessPolicy

from mathesar.api.utils import get_table_or_404
from mathesar.models.users import DatabaseRole, Role, SchemaRole


class RecordAccessPolicy(AccessPolicy):
    # Anyone can view a Record as long as they have
    # at least a Viewer access to the schema or its database
    # Create Access is restricted to superusers or managers of the schema or the database the constraint is part of.
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_table_viewer)']
        },
        # Only superuser or schema/database manager can delete the role
        {
            'action': ['destroy', 'update', 'partial_update'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_table_editor)']
        },
    ]

    def is_table_viewer(self, request, view, action):
        # Record access control is based on Schema and Database Roles as of now
        # TODO Include Table Role based access when Table Roles are introduced
        table = get_table_or_404(view.kwargs['table_pk'])
        allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)

        is_schema_viewer = SchemaRole.objects.filter(
            user=request.user,
            schema=table.schema,
            role__in=allowed_roles
        ).exists()
        is_db_viewer = DatabaseRole.objects.filter(
            user=request.user,
            database=table.schema.database,
            role__in=allowed_roles
        ).exists()
        return is_db_viewer or is_schema_viewer

    def is_table_editor(self, request, view, action):
        # Record access control is based on Schema and Database Roles as of now
        # TODO Include Table Role based access when Table Roles are introduced
        table = get_table_or_404(view.kwargs['table_pk'])
        allowed_roles = (Role.MANAGER.value, Role.EDITOR.value)

        is_schema_manager = SchemaRole.objects.filter(
            user=request.user,
            schema=table.schema,
            role__in=allowed_roles
        ).exists()
        is_db_manager = DatabaseRole.objects.filter(
            user=request.user,
            database=table.schema.database,
            role__in=allowed_roles
        ).exists()
        return is_db_manager or is_schema_manager
