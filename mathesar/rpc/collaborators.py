
from typing import TypedDict

from mathesar.models.base import UserDatabaseRoleMap, Database, ConfiguredRole
from mathesar.models.users import User
from mathesar.rpc.decorators import mathesar_rpc_method


class CollaboratorInfo(TypedDict):
    """
    Information about a collaborator in a database.

    Attributes:
        id (int): The Django ID of the UserDatabaseRoleMap model instance.
        user_id (int): The ID of the User assigned as a collaborator.
        database_id (int): The ID of the Database the collaborator belongs to.
        configured_role_id (int): The ID of the ConfiguredRole assigned to the collaborator.
    """

    id: int
    user_id: int
    database_id: int
    configured_role_id: int

    @classmethod
    def from_model(cls, model):
        """Construct a CollaboratorInfo object from a model instance."""
        return cls(
            id=model.id,
            user_id=model.user.id,
            database_id=model.database.id,
            configured_role_id=model.configured_role.id,
        )


@mathesar_rpc_method(name="collaborators.list", auth="login")
def list_(*, database_id: int = None, **kwargs) -> list[CollaboratorInfo]:
    """
    Retrieve a list of collaborators.

    If `database_id` is provided, only collaborators belonging to that database
    are returned. If `database_id` is None, all collaborators across all databases
    are returned.

    Args:
        database_id (int | None): The ID of the database whose collaborators
            should be listed. If None, collaborators for all databases are fetched.

        **kwargs: Additional RPC-layer arguments (unused).

    Returns:
        list[CollaboratorInfo]: A list of collaborator metadata dictionaries.

    Notes:
        - Requires authentication (`auth="login"`).
        - Exposed to clients as the RPC method: `collaborators.list`.
    """
    if database_id is not None:
        queryset = UserDatabaseRoleMap.objects.filter(database__id=database_id)
    else:
        queryset = UserDatabaseRoleMap.objects.all()

    return [CollaboratorInfo.from_model(obj) for obj in queryset]


@mathesar_rpc_method(name="collaborators.add")
def add(
    *,
    database_id: int,
    user_id: int,
    configured_role_id: int,
    **kwargs,
) -> CollaboratorInfo:
    """
    Create and register a new collaborator for a database.

    Args:
        database_id (int): The ID of the database to which the collaborator
            should be added.
        user_id (int): The ID of the User who will become the collaborator.
        configured_role_id (int): The ID of the ConfiguredRole that defines
            the collaborator's permissions.

        **kwargs: Additional RPC-layer arguments (unused).

    Returns:
        CollaboratorInfo: Metadata about the newly created collaborator.

    Raises:
        Database.DoesNotExist: If the provided `database_id` does not match any database.
        User.DoesNotExist: If the provided `user_id` does not exist.
        ConfiguredRole.DoesNotExist: If `configured_role_id` is invalid.
    """
    database = Database.objects.get(id=database_id)
    user = User.objects.get(id=user_id)
    configured_role = ConfiguredRole.objects.get(id=configured_role_id)

    collaborator = UserDatabaseRoleMap.objects.create(
        database=database,
        user=user,
        configured_role=configured_role,
        server=configured_role.server,
    )

    return CollaboratorInfo.from_model(collaborator)


@mathesar_rpc_method(name="collaborators.delete")
def delete(*, collaborator_id: int, **kwargs) -> None:
    """
    Delete a collaborator from a database.

    Args:
        collaborator_id (int): The ID of the UserDatabaseRoleMap instance
            representing the collaborator to be removed.

        **kwargs: Additional RPC-layer arguments (unused).

    Raises:
        UserDatabaseRoleMap.DoesNotExist: If the collaborator does not exist.
    """
    collaborator = UserDatabaseRoleMap.objects.get(id=collaborator_id)
    collaborator.delete()


@mathesar_rpc_method(name="collaborators.set_role")
def set_role(
    *,
    collaborator_id: int,
    configured_role_id: int,
    **kwargs,
) -> CollaboratorInfo:
    """
    Update the configured role assigned to an existing collaborator.

    Args:
        collaborator_id (int): The UserDatabaseRoleMap ID of the collaborator.
        configured_role_id (int): The new ConfiguredRole ID to assign.

        **kwargs: Additional RPC-layer arguments (unused).

    Returns:
        CollaboratorInfo: Updated collaborator metadata.

    Raises:
        UserDatabaseRoleMap.DoesNotExist: If the collaborator does not exist.
        ConfiguredRole.DoesNotExist: If the new role does not exist.
    """
    collaborator = UserDatabaseRoleMap.objects.get(id=collaborator_id)
    configured_role = ConfiguredRole.objects.get(id=configured_role_id)

    collaborator.configured_role = configured_role
    collaborator.save()

    return CollaboratorInfo.from_model(collaborator)
