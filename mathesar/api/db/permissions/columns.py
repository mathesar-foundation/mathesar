from rest_access_policy import AccessPolicy


class ColumnAccessPolicy(AccessPolicy):
    """
    Anyone can view a Column as long as they have
    at least a Viewer access to the Schema or the database
    Only superuser or schema/database manager can delete/modify/create a Column
    """

    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': 'is_atleast_viewer_nested_table_resource'
        },
        {
            'action': ['dependents'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_viewer_nested_table_resource'
        },
        {
            'action': ['destroy', 'update', 'partial_update', 'create'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_manager_nested_table_resource'
        },
    ]
