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
from mathesar.utils.users import (
    get_user,
    list_users,
    add_user,
    update_self_user_info,
    update_other_user_info,
    delete_user,
    change_password,
    revoke_password
)


class UserInfo(TypedDict):
    id: int
    username: str
    is_superuser: bool
    email: str
    full_name: str
    display_language: str

    @classmethod
    def from_model(cls, model):
        return cls(
            id=model.id,
            username=model.username,
            is_superuser=model.is_superuser,
            email=model.email,
            full_name=model.full_name,
            display_language=model.display_language
        )


class UserDef(TypedDict):
    username: str
    password: str
    is_superuser: bool
    email: Optional[str]
    full_name: Optional[str]
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
    user = get_user(user_id)
    return UserInfo.from_model(user)


@rpc_method(name='users.list')
@http_basic_auth_login_required
@handle_rpc_exceptions
def list_() -> list[UserInfo]:
    users = list_users()
    return [UserInfo.from_model(user) for user in users]


@rpc_method(name='users.patch_self')
@http_basic_auth_login_required
@handle_rpc_exceptions
def patch_self(
    *,
    username: str,
    email: str,
    full_name: str,
    display_language: str,
    **kwargs
) -> UserInfo:
    user = kwargs.get(REQUEST_KEY).user
    updated_user_info = update_self_user_info(
        user_id=user.id,
        username=username,
        email=email,
        full_name=full_name,
        display_language=display_language
    )
    return UserInfo.from_model(updated_user_info)


@rpc_method(name='users.patch_other')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def patch_other(
    *,
    user_id: int,
    username: str,
    is_superuser: bool,
    email: str,
    full_name: str,
    display_language: str
) -> UserInfo:
    updated_user_info = update_other_user_info(
        user_id=user_id,
        username=username,
        is_superuser=is_superuser,
        email=email,
        full_name=full_name,
        display_language=display_language
    )
    return UserInfo.from_model(updated_user_info)


@rpc_method(name='users.password.replace_own')
@http_basic_auth_login_required
@handle_rpc_exceptions
def replace_own(
    *,
    old_password: str,
    new_password: str,
    **kwargs
) -> None:
    user = kwargs.get(REQUEST_KEY).user
    if not user.check_password(old_password):
        raise Exception('Old password is not correct')
    change_password(user.id, new_password)


@rpc_method(name='users.password.revoke')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def revoke(
    *,
    user_id: int,
    new_password: str,
) -> None:
    revoke_password(user_id, new_password)
