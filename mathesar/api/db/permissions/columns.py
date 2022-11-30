from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.api.utils import get_table_or_404
from mathesar.models.users import DatabaseRole, Role, SchemaRole


class ColumnAccessPolicy(AccessPolicy):
    """
    Anyone can view a Column as long as they have
    at least a Viewer access to the Schema
    Only superuser or schema/database manager can delete/modify/create a Column
    """

    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
        },
        {
            'action': ['destroy', 'update', 'partial_update', 'create'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': ['(is_superuser or is_table_manager)']
        },
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not request.user.is_superuser:
            allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
            permissible_database_role_filter = (
                Q(table__schema__database__database_role__role__in=allowed_roles) & Q(table__schema__database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (Q(table__schema__schema_role__role__in=allowed_roles) & Q(table__schema__schema_role__user=request.user))
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)

        return qs

    def is_table_manager(self, request, view, action):
        # Column access control is based on Schema and Database Roles as of now
        # TODO Include Table Role based access when Table Roles are introduced
        table = get_table_or_404(view.kwargs['table_pk'])

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
