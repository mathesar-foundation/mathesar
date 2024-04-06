from django.db.models import Q
from rest_access_policy import AccessPolicy

from mathesar.models.users import Role


class UIDatabaseAccessPolicy(AccessPolicy):
    """
    Anyone can view Database objects and
    Database properties like types and filters if they have a Viewer access
    """
    statements = [
        {
            'action': [
                'list', 'retrieve', 'types', 'functions', 'filters'
            ],
            'principal': 'authenticated',
            'effect': 'allow',
        },
        {
            'action': [
                'create', 'partial_update', 'destroy',
                'create_from_known_connection',
                'create_from_scratch',
                'create_with_new_user',
            ],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition': 'is_superuser'
        }
    ]

    @classmethod
    def scope_queryset(cls, request, qs):
        if not (request.user.is_superuser or request.user.is_anonymous):
            allowed_roles = (Role.MANAGER.value,)
            if request.method.lower() == 'get':
                allowed_roles = allowed_roles + (Role.EDITOR.value, Role.VIEWER.value)
            qs = qs.filter(
                Q(database_role__role__in=allowed_roles)
                & Q(database_role__user=request.user)
            )
        return qs
