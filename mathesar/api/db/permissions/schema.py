from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class SchemaAccessPolicy(AccessPolicy):

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
