"""
Classes and functions exposed to the RPC endpoint for listing types in a database.
"""

from typing import Optional, TypedDict

from modernrpc.core import rpc_method
from modernrpc.auth.basic import http_basic_auth_login_required

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from mathesar.database.types import UIType
from mathesar.api.display_options import DISPLAY_OPTIONS_BY_UI_TYPE


class TypeInfo(TypedDict):
    """
    Information about a type.

    Attributes:
        identifier: Specifies the type class that db_type(s) belongs to.
        name: Specifies the UI name for a type class.
        db_types: Specifies the name(s) of types present on the database.
        display_options: Specifies metadata related to a type class.
    """
    identifier: str
    name: str
    db_types: list
    display_options: Optional[dict]

    @classmethod
    def from_dict(cls, type):
        return cls(
            identifier=type.id,
            name=type.display_name,
            db_types=[db_type.id for db_type in type.db_types],
            display_options=DISPLAY_OPTIONS_BY_UI_TYPE.get(type, None)
        )


@rpc_method(name="types.list")
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_() -> TypeInfo:
    """
    List information about types available on the database. Exposed as `list`.
    """
    return [TypeInfo.from_dict(type) for type in UIType]
