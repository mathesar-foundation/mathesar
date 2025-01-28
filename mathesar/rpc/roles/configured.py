from typing import TypedDict

from mathesar.models.base import ConfiguredRole, Server
from mathesar.rpc.decorators import mathesar_rpc_method


class ConfiguredRoleInfo(TypedDict):
    """
    Information about a role configured in Mathesar.

    Attributes:
        id: the Django ID of the ConfiguredRole model instance.
        name: The name of the role.
        server_id: The Django ID of the Server model instance for the role.
    """
    id: int
    name: str
    server_id: int

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            name=model.name,
            server_id=model.server.id
        )


@mathesar_rpc_method(name="roles.configured.list", auth="login")
def list_(*, server_id: int, **kwargs) -> list[ConfiguredRoleInfo]:
    """
    List information about roles configured in Mathesar. Exposed as `list`.

    Args:
        server_id: The Django id of the Server containing the configured roles.

    Returns:
        A list of configured roles.
    """
    configured_role_qs = ConfiguredRole.objects.filter(server__id=server_id)

    return [ConfiguredRoleInfo.from_model(db_model) for db_model in configured_role_qs]


@mathesar_rpc_method(name='roles.configured.add')
def add(
        *,
        server_id: int,
        name: str,
        password: str,
        **kwargs
) -> ConfiguredRoleInfo:
    """
    Configure a role in Mathesar for a database server.

    Args:
        server_id: The Django id of the Server to contain the configured role.
        name: The name of the role.
        password: The password for the role.

    Returns:
        The newly configured role.
    """
    server = Server.objects.get(id=server_id)
    configured_role = ConfiguredRole.objects.create(
        server=server,
        name=name,
        password=password
    )
    return ConfiguredRoleInfo.from_model(configured_role)


@mathesar_rpc_method(name='roles.configured.delete')
def delete(*, configured_role_id: int, **kwargs):
    """
    Delete a configured role for a server.

    Args:
        configured_role_id: The Django id of the ConfiguredRole model instance.
    """
    configured_role = ConfiguredRole.objects.get(id=configured_role_id)
    configured_role.delete()


@mathesar_rpc_method(name='roles.configured.set_password')
def set_password(
        *,
        configured_role_id: int,
        password: str,
        **kwargs
):
    """
    Set the password of a configured role for a server.

    Args:
        configured_role_id: The Django id of the ConfiguredRole model instance.
        password: The password for the role.
    """
    configured_role = ConfiguredRole.objects.get(id=configured_role_id)
    configured_role.password = password
    configured_role.save()
