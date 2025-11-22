from typing import TypedDict

from mathesar.models.base import UserDatabaseRoleMap, Database, ConfiguredRole
from mathesar.models.users import User
from mathesar.rpc.decorators import mathesar_rpc_method


class CollaboratorInfo(TypedDict):
    """
    Information about a collaborator.

    Attributes:
        id: the Django ID of the UserDatabaseRoleMap model instance.
        user_id: The Django ID of the User model instance of the collaborator.
        database_id: the Django ID of the Database model instance for the collaborator.
        configured_role_id: The Django ID of the ConfiguredRole model instance for the collaborator.
    """
    id: int
    user_id: int
    database_id: int
    configured_role_id: int

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            user_id=model.user.id,
            database_id=model.database.id,
            configured_role_id=model.configured_role.id
        )


@mathesar_rpc_method(name="collaborators.list", auth="login")
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


@mathesar_rpc_method(name="collaborators.add")
def add(
        *,
        database_id: int,
        user_id: int,
        configured_role_id: int,
        **kwargs
) -> CollaboratorInfo:
    """
    Set up a new collaborator for a database.

    Args:
        database_id: The Django id of the Database to associate with the collaborator.
        user_id: The Django id of the User model instance who'd be the collaborator.
        configured_role_id: The Django id of the ConfiguredRole model instance to associate with the collaborator.
    """
    database = Database.objects.get(id=database_id)
    user = User.objects.get(id=user_id)
    configured_role = ConfiguredRole.objects.get(id=configured_role_id)
    collaborator = UserDatabaseRoleMap.objects.create(
        database=database,
        user=user,
        configured_role=configured_role,
        server=configured_role.server
    )
    return CollaboratorInfo.from_model(collaborator)


@mathesar_rpc_method(name="collaborators.delete")
def delete(*, collaborator_id: int, **kwargs):
    """
    Delete a collaborator from a database.

    Args:
        collaborator_id: The Django id of the UserDatabaseRoleMap model instance of the collaborator.
    """
    collaborator = UserDatabaseRoleMap.objects.get(id=collaborator_id)
    collaborator.delete()


@mathesar_rpc_method(name="collaborators.set_role")
def set_role(
        *,
        collaborator_id: int,
        configured_role_id: int,
        **kwargs
) -> CollaboratorInfo:
    """
    Set the role of a collaborator for a database.

    Args:
        collaborator_id: The Django id of the UserDatabaseRoleMap model instance of the collaborator.
        configured_role_id: The Django id of the ConfiguredRole model instance to associate with the collaborator.
    """
    collaborator = UserDatabaseRoleMap.objects.get(id=collaborator_id)
    configured_role = ConfiguredRole.objects.get(id=configured_role_id)
    collaborator.configured_role = configured_role
    collaborator.save()
    return CollaboratorInfo.from_model(collaborator)
