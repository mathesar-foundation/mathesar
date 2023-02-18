import django
from django.db.models import Q, Case, Value, When, CharField
from rest_access_policy import AccessPolicy

from mathesar.models.users import DatabaseRole, Role, SchemaRole


class TableAccessPolicy(AccessPolicy):
    """
    Anyone can view Table as long as they have
    at least a Viewer access to the schema or its database
    Create Access is restricted to superusers or managers of the schema or the database the table is part of.
    Only superuser or schema/database manager can delete/modify/update the Table
    """

    statements = [
        {
            # Restrictions for the create method is done by the Serializers when creating the schema,
            # As the permissions depend on the database object.
            'action': [
                'list',
                'retrieve',
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
            'condition_expression': ['(is_superuser or is_table_manager)']
        },
    ]

    @classmethod
    def _scope_queryset(cls, request, qs, allowed_roles, confirmed_table_roles):
        if not (request.user.is_superuser or request.user.is_anonymous):
            permissible_database_role_filter = (
                Q(schema__database__database_role__role__in=allowed_roles)
                & Q(schema__database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (
                Q(schema__schema_role__role__in=allowed_roles) & Q(schema__schema_role__user=request.user)
            )
            permissible_schema_role_filter = Q(schema__schema_role__role__in=confirmed_table_roles)
            permissible_table_view_filter = Q(import_verified=True) | Q(import_verified__isnull=True)
            confirmed_table = "CONFIRMED"
            unconfirmed_table = "UNCONFIRMED"
            not_allowed = "NOT_ALLOWED"

            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)

            qs = qs.annotate(
                to_count=Case(
                    When(permissible_schema_role_filter, then=Case(
                        When(permissible_table_view_filter, then=Value(confirmed_table)),
                        default=Value(unconfirmed_table)
                    )),
                    default=Value(not_allowed), output_field=CharField()
                )
            )
            qs = qs.filter(Q(to_count=not_allowed) | Q(to_count=confirmed_table))
        return qs

    @classmethod
    def scope_queryset(cls, request, qs):
        """
        Used for scoping the queryset of Serializer RelatedField which reference a Table
        """
        allowed_roles = (Role.MANAGER.value,)
        confirmed_table_roles = (Role.EDITOR.value, Role.VIEWER.value,)

        if request.method.lower() == 'get':
            allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
        return TableAccessPolicy._scope_queryset(request, qs, allowed_roles, confirmed_table_roles)

    @classmethod
    def scope_viewset_queryset(cls, request, qs):
        """
        Used for scoping queryset of the TableViewSet.
        It is used for listing all the table the user has Viewer access.
        Restrictions are then applied based on the request method using the Policy statements.
        This helps us to throw correct error status code instead of a 404 error code
        """
        allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
        confirmed_table_roles = (Role.EDITOR.value, Role.VIEWER.value,)
        return TableAccessPolicy._scope_queryset(request, qs, allowed_roles, confirmed_table_roles)

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
