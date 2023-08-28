from rest_access_policy import AccessPolicy


class RecordAccessPolicy(AccessPolicy):
    """
    Anyone can view a Record as long as they are a superuser or have
    at least a Viewer access to the Schema or the Database of the Table.
    The permissions trickle down, so if someone has a Viewer Access for a Database
    They automatically become a Schema Viewer
    Refer https://wiki.mathesar.org/en/product/specs/users-permissions#database-permissions
    Only superuser or schema/database Manager/Editor can delete/modify/create a Record
    """
    statements = [
        {
            'action': ['list', 'retrieve'],
            'principal': '*',
            'effect': 'allow',
            'condition_expression': 'is_atleast_viewer_nested_table_resource'
        },
        {
            'action': ['destroy', 'update', 'partial_update', 'create', 'delete'],
            'principal': 'authenticated',
            'effect': 'allow',
            'condition_expression': 'is_atleast_editor_nested_table_resource'
        },
    ]
