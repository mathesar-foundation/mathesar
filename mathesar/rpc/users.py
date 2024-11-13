"""
Classes and functions exposed to the RPC endpoint for managing mathesar users.
"""
from typing import Optional, TypedDict
from modernrpc.core import rpc_method, REQUEST_KEY
from modernrpc.auth.basic import (
    http_basic_auth_login_required,
    http_basic_auth_superuser_required
)

from mathesar.rpc.exceptions.handlers import handle_rpc_exceptions
from modernrpc.exceptions import AuthenticationFailed
from mathesar.utils.users import (
    get_user_info,
    list_user_info,
    add_user,
    update_user_info,
    delete_user
)


class UserInfo(TypedDict):
    id: int
    username: str
    is_superuser: bool
    email: str
    full_name: str
    short_name: str
    display_language: str

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            username=model.username,
            is_superuser=model.is_superuser,
            email=model.email,
            full_name=model.full_name,
            short_name=model.short_name,
            display_language=model.display_language
        )


class UserDef(TypedDict):
    username: str
    password: str
    is_superuser: bool
    email: Optional[str]
    full_name: Optional[str]
    short_name: Optional[str]
    display_language: Optional[str]


class SettableUserInfo(TypedDict):
    username: Optional[str]
    is_superuser: Optional[bool]
    email: Optional[str]
    full_name: Optional[str]
    short_name: Optional[str]
    display_language: Optional[str]


@rpc_method(name='users.add')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def add(*, user_def: UserDef) -> UserInfo:
    user = add_user(user_def)
    return UserInfo.from_model(user)


@rpc_method(name='users.delete')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def delete(*, user_id: int) -> None:
    delete_user(user_id)


@rpc_method(name="users.get")
@http_basic_auth_login_required
@handle_rpc_exceptions
def get(*, user_id: int) -> UserInfo:
    user = get_user_info(user_id)
    return UserInfo.from_model(user)


@rpc_method(name='users.list')
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_() -> list[UserInfo]:
    users = list_user_info()
    return [UserInfo.from_model(user) for user in users]


@rpc_method(name='users.patch')
@http_basic_auth_login_required
@handle_rpc_exceptions
def patch(
    *,
    user_id: int,
    user_info: SettableUserInfo,
    **kwargs
) -> UserInfo:
    user = kwargs.get(REQUEST_KEY).user
    if not (user.id == user_id or user.is_superuser):
        raise AuthenticationFailed('users.patch')
    updated_user_info = update_user_info(user_id, user_info)
    return UserInfo.from_model(updated_user_info)
