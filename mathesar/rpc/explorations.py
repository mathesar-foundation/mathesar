"""
Classes and functions exposed to the RPC endpoint for managing explorations.
"""
from typing import Optional, TypedDict

from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.rpc.utils import connect
from mathesar.utils.explorations import get_explorations, delete_exploration, run_exploration


class ExplorationInfo(TypedDict):
    """
    Information about an exploration.

    Attributes:
        id: The Django id of an exploration.
        database_id: The Django id of the database containing the exploration.
        name: The name of the exploration.
        base_table_oid: The OID of the base table of the exploration on the database.
        initial_columns: A list describing the columns to be included in the exploration.
        transformations: A list describing the transformations to be made on the included columns.
        display_options: A list desrcibing metadata for the columns in the explorations.
        display_names: A map between the actual column names on the database and the alias to be displayed(if any).
        description: The description of the exploration.
    """
    id: int
    database_id: int
    name: str
    base_table_oid: int
    initial_columns: list
    transformations: Optional[list]
    display_options: Optional[list]
    display_names: Optional[dict]
    description: Optional[str]

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            database_id=model.database.id,
            name=model.name,
            base_table_oid=model.base_table_oid,
            initial_columns=model.initial_columns,
            transformations=model.transformations,
            display_options=model.display_options,
            display_names=model.display_names,
            description=model.description,
        )


class ExplorationDef(TypedDict):
    """
    Definition about a runnable exploration.

    Attributes:
        base_table_oid: The OID of the base table of the exploration on the database.
        initial_columns: A list describing the columns to be included in the exploration.
        display_names: A map between the actual column names on the database and the alias to be displayed.
        transformations: A list describing the transformations to be made on the included columns.
        parameters: A dict describing the properties to be applied while retrieving records e.g. limit, offset, filter, order_by, etc.
    """
    base_table_oid: int
    initial_columns: list
    display_names: dict
    transformations: Optional[list]
    parameters: Optional[dict]


class ExplorationResult(TypedDict):
    """
    Result of a ran exploration.

    Attributes:
        query: A dict describing the exploration that ran.
        records: A dict describing the total count of records along with the contents of those records.
        output_columns: A tuple describing the names of the columns included in the exploration.
        column_metadata: A dict describing the metadata applied to included columns.
        parameters: A dict describing the properties applied while retrieving records e.g. limit, offset, filter, order_by, etc.
    """
    query: dict
    records: dict
    output_columns: tuple
    column_metadata: dict
    parameters: dict

    @classmethod
    def from_dict(cls, e):
        return cls(
            query=e["query"],
            records=e["records"],
            output_columns=e["output_columns"],
            column_metadata=e["column_metadata"],
            parameters=e["parameters"]
        )


@rpc_method(name="explorations.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_(*, database_id: int, **kwargs) -> list[ExplorationInfo]:
    """
    List information about explorations for a database. Exposed as `list`.

    Args:
        database_id: The Django id of the database containing the explorations.

    Returns:
        A list of exploration details.
    """
    explorations = get_explorations(database_id)
    return [ExplorationInfo.from_model(exploration) for exploration in explorations]


@rpc_method(name="explorations.delete")
@http_basic_auth_login_required
@handle_rpc_exceptions
def delete(*, exploration_id: int, **kwargs) -> None:
    """
    Delete an exploration.

    Args:
        exploration_id: The Django id of the exploration to delete.
    """
    delete_exploration(exploration_id)


@rpc_method(name="explorations.run")
@http_basic_auth_login_required
@handle_rpc_exceptions
def run(*, exploration_def: ExplorationDef, database_id: int, **kwargs) -> ExplorationResult:
    """
    Run an exploration.

    Args:
        exploration_def: A dict describing an exploration to run.
        database_id: The Django id of the database containing the base table for the exploration.
    """
    user = kwargs.get(REQUEST_KEY).user
    with connect(database_id, user) as conn:
        exploration_result = run_exploration(exploration_def, database_id, conn)
    return ExplorationResult.from_dict(exploration_result)
