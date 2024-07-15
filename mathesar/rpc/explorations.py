"""
Classes and functions exposed to the RPC endpoint for managing explorations.
"""
from typing import TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.utils.explorations import get_explorations, delete_exploration


class ExplorationInfo(TypedDict):
    id: int
    database: int
    base_table_oid: int
    name: str
    description: str
    initial_columns: list
    transformations: dict
    display_options: list
    display_names: dict

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            database=model.database,
            base_table_oid=model.base_table_oid,
            name=model.name,
            description=model.description,
            initial_columns=model.initial_columns,
            transformations=model.transformations,
            display_options=model.display_options,
            display_names=model.display_names,
        )


@rpc_method(name="explorations.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[ExplorationInfo]:
    explorations = get_explorations(database_id)
    return [ExplorationInfo.from_model(exploration) for exploration in explorations]


@rpc_method(name="explorations.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(*, exploration_id: int, **kwargs) -> None:
    delete_exploration(exploration_id)
