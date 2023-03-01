from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class QueryTableAccessPolicy(AccessPolicy):

    """
    Used for scoping Table queryset when creating a query.
    We cannot use TableAccessPolicy as it restricts creation if a user does not have write access but a Query can be created by a Viewer too
    """
    @classmethod
    def scope_queryset(cls, request, qs):
        allowed_roles = (Role.MANAGER.value, Role.EDITOR.value, Role.VIEWER.value)
        if not (request.user.is_superuser or request.user.is_anonymous):
            permissible_database_role_filter = (
                Q(schema__database__database_role__role__in=allowed_roles)
                & Q(schema__database__database_role__user=request.user)
            )
            permissible_schema_roles_filter = (
                Q(schema__schema_role__role__in=allowed_roles) & Q(schema__schema_role__user=request.user)
            )
            qs = qs.filter(permissible_database_role_filter | permissible_schema_roles_filter)
        return qs
