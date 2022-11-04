from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class DatabaseAccessPolicy(AccessPolicy):
    statements = [
        # Anyone can read all schema
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
        },
        # Only superusers can create users
        {
            'action': ['create', 'destroy', 'partial_update', 'update'],
            'principal': ['*'],
            'effect': 'allow',
        }
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not request.user.is_superuser:
            allowed_roles = (Role.MANAGER.value)
            if request.method.lower() == 'get':
                allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
            qs = qs.filter(Q(databaserole__role__in=allowed_roles) & Q(databaserole__user=request.user))
        return qs
