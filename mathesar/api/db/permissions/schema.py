from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import DatabaseRole, Role, SchemaRole


class SchemaAccessPolicy(AccessPolicy):
    # Anyone can view a Schema as long as they have
    # at least a Viewer access to that schema or the database the schema is part of
    # Create access is restricted to superusers or managers of the database the schema is part of.
    # This restriction is taken care of the serializer used for creating the Schema
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
    def _scope_queryset(cls, request, qs, allowed_roles):
        if not request.user.is_superuser:
            permissible_database_role_filter = (
                Q(database__database_role__role__in=allowed_roles) & Q(database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (
                Q(schema_role__role__in=allowed_roles) & Q(schema_role__user=request.user)
            )
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)
        return qs

    @classmethod
    def scope_queryset(cls, request, qs):
        """
        Used for scoping the queryset of Serializer RelatedField which reference a Schema
        """
        allowed_roles = (Role.MANAGER.value,)

        if request.method.lower() == 'get':
            allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
        return SchemaAccessPolicy._scope_queryset(request, qs, allowed_roles)

    @classmethod
    def scope_viewset_queryset(cls, request, qs):
        """
        Used for scoping queryset of the SchemaViewSet.
        It is used for listing all the schema the user has Viewer access.
         Restrictions are then applied based on the request method using the Policy statements.
         This helps us to throw correct error status code instead of a 404 error code
        """
        allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
        return SchemaAccessPolicy._scope_queryset(request, qs, allowed_roles)

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
