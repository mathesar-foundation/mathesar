from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.api.permission_utils import TableAccessInspector
from mathesar.models.users import Role


class TableAccessPolicy(AccessPolicy):
    """
    Anyone can view Table as long as they have
    at least a Viewer access to the schema or its database
    Create Access is restricted to superusers or managers of the schema or the database the table is part of.
    Only superuser or schema/database manager can delete/modify/update the Table
    """

    statements = [
        {
            'action': [
                'retrieve',
            ],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': 'is_atleast_table_viewer'
        },
        {
            # Restrictions for the create method is done by the Serializers when creating the schema,
            # As the permissions depend on the database object.
            'action': [
                'list',
                'create',
                'type_suggestions',
                'dependents',
                'ui_dependents',
                'joinable_tables',
            ],
            'principal': 'authenticated',
            'effect': 'allow',
        },
        {
            'action': [
                'destroy',
                'update',
                'partial_update',
                'split_table',
                'move_columns',
                'previews',
                'existing_import',
                'map_imported_columns'
            ],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_table_manager'
        },
    ]

    @classmethod
    def _scope_queryset(cls, request, qs, allowed_roles):
        if not (request.user.is_superuser or request.user.is_anonymous):
            db_role_access_filter = (
                Q(schema__database__database_role__role__in=allowed_roles)
                & Q(schema__database__database_role__user=request.user)
            )
            schema_role_access_filter = (
                Q(schema__schema_role__role__in=allowed_roles)
                & Q(schema__schema_role__user=request.user)
            )

            # Filters to check whether user is a db/schema manager
            is_database_manager = (
                Q(schema__database__database_role__role='manager')
                & Q(schema__database__database_role__user=request.user)
            )
            is_schema_manager = (
                Q(schema__schema_role__role='manager')
                & Q(schema__schema_role__user=request.user)
            )

            # Filter for confirmed tables
            cnf_table_filter = (Q(import_verified=True) | Q(import_verified__isnull=True))

            # Filters for the purpose of including/removing unconfirmed tables based on user's role
            permissible_database_role_filter = (
                is_database_manager & Q(import_verified=False)
                | cnf_table_filter & db_role_access_filter
            )
            permissible_schema_roles_filter = (
                is_schema_manager & Q(import_verified=False)
                | cnf_table_filter & schema_role_access_filter
            )

            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)
        return qs

    @classmethod
    def scope_queryset(cls, request, qs):
        """
        Used for scoping the queryset of Serializer RelatedField which reference a Table
        """
        allowed_roles = (Role.MANAGER.value,)

        if request.method.lower() == 'get':
            allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
        return TableAccessPolicy._scope_queryset(request, qs, allowed_roles)

    @classmethod
    def scope_viewset_queryset(cls, request, qs):
        """
        Used for scoping queryset of the TableViewSet.
        It is used for listing all the table the user has Viewer access.
        Restrictions are then applied based on the request method using the Policy statements.
        This helps us to throw correct error status code instead of a 404 error code
        """
        allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
        return TableAccessPolicy._scope_queryset(request, qs, allowed_roles)

    def is_atleast_table_manager(self, request, view, action):
        table = view.get_object()
        return TableAccessInspector(request.user, table).is_atleast_manager()
