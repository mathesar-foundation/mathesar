from typing import TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.models.base import UserDatabaseRoleMap
from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions


class CollaboratorInfo(TypedDict):
    """
    Information about a collaborator.

    Attributes:
        id: the Django ID of the UserDatabaseRoleMap model instance.
        user_id: The Django ID of the User model instance of the collaborator.
        database_id: the Django ID of the Database model instance for the collaborator.
        role_id: The Django ID of the Role model instance for the collaborator.
    """
    id: int
    user_id: int
    database_id: int
    role_id: int

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            user_id=model.user.id,
            database_id=model.database.id,
            role_id=model.role.id
        )


@rpc_method(name="collaborators.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int = None, **kwargs) -> list[CollaboratorInfo]:
    """
    List information about collaborators. Exposed as `list`.

    If called with no `database_id`, all collaborators for all databases are listed.

    Args:
        database_id: The Django id of the database associated with the collaborators.

    Returns:
        A list of collaborators.
    """
    if database_id is not None:
        user_database_role_map_qs = UserDatabaseRoleMap.objects.filter(database__id=database_id)
    else:
        user_database_role_map_qs = UserDatabaseRoleMap.objects.all()

    return [CollaboratorInfo.from_model(db_model) for db_model in user_database_role_map_qs]
