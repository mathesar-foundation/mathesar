from rest_access_policy import AccessPolicy


class DatabaseRoleAccessPolicy(AccessPolicy):
    statements = [
        # Avoid showing other users roles if they are not a superuser
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
        },
        # Only superuser can assign a database role
        {
            'action': ['create', 'destroy'],
            'principal': ['*'],
            'effect': 'allow',
            'condition': 'is_superuser'
        },
    ]
