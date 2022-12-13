from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class DatabaseAccessPolicy(AccessPolicy):
    """
    Anyone can view Database objects and
    Database properties like types and functions if they have a Viewer access
    """
    statements = [
        {
            'action': ['list', 'retrieve', 'types', 'functions'],
            'principal': '*',
            'effect': 'allow',
        }
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not request.user.is_superuser:
            allowed_roles = (Role.MANAGER.value,)
            if request.method.lower() == 'get':
                allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
            qs = qs.filter(
                Q(database_role__role__in=allowed_roles)
                & Q(database_role__user=request.user)
            )
        return qs
