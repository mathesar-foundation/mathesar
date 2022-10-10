from rest_access_policy import AccessPolicy


class UserAccessPolicy(AccessPolicy):
    statements = [
        # Anyone can read all users
        {
            "action": ["list", "retrieve"],
            "principal": "*",
            "effect": "allow"
        },
        # Only superusers can create users
        {
            "action": ["create"],
            "principal": ["*"],
            "effect": "allow",
            "condition": "is_superuser"
        },
        # Users can edit and delete themselves
        # Superusers can also edit and delete users
        {
            "action": ["destroy", "partial_update", "update"],
            "principal": ["*"],
            "effect": "allow",
            "condition_expression": ["(is_superuser or is_self)"]
        },
    ]
