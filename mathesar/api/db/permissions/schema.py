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
            permissible_databaserole_filter = (
                Q(database__databaserole__role__in=allowed_roles) & Q(database__databaserole__user=request.user)
            )
            permissible_schemaroles_filter = (Q(schemarole__role__in=allowed_roles) & Q(schemarole__user=request.user))
            qs = qs.filter(permissible_databaserole_filter | permissible_schemaroles_filter)
        return qs
