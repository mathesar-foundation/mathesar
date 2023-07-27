from rest_access_policy import AccessPolicy


class ConstraintAccessPolicy(AccessPolicy):
    """
    Anyone can view Constraint as long as they have
    at least a Viewer access to the schema or its database
    Only superuser or schema/database manager can create/delete/update the Constraint
    """
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': 'is_atleast_viewer_nested_table_resource'
        },
        {
            'action': ['create', 'destroy', 'update', 'partial_update'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_manager_nested_table_resource'
        },
    ]
