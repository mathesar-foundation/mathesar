"""
Classes and functions exposed to the RPC endpoint for managing mathesar users.
"""
from typing import Optional, TypedDict
from modernrpc.core import REQUEST_KEY

from mathesar.rpc.decorators import mathesar_rpc_method
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
    """
    Information about a mathesar user.

    Attributes:
        id: The Django id of the user.
        username: The username of the user.
        is_superuser: Specifies whether the user is a superuser.
        email: The email of the user.
        full_name: The full name of the user.
        display_language: Specifies the display language for the user, can be either `en` or `ja`.
    """
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
    """
    Definition for creating a mathesar user.

    Attributes:
        username: The username of the user.
        password: The password of the user.
        is_superuser: Whether the user is a superuser.
        email: The email of the user.
        full_name: The full name of the user.
        display_language: Specifies the display language for the user, can be set to either `en` or `ja`.
    """
    username: str
    password: str
    is_superuser: bool
    email: Optional[str]
    full_name: Optional[str]
    display_language: Optional[str]


@mathesar_rpc_method(name='users.add')
def add(*, user_def: UserDef) -> UserInfo:
    """
    Add a new mathesar user.

    Args:
        user_def: A dict describing the user to create.

    Privileges:
        This endpoint requires the caller to be a superuser.

    Returns:
        The information of the created user.
    """
    user = add_user(user_def)
    return UserInfo.from_model(user)


@mathesar_rpc_method(name='users.delete')
def delete(*, user_id: int) -> None:
    """
    Delete a mathesar user.

    Args:
        user_id: The Django id of the user to delete.

    Privileges:
        This endpoint requires the caller to be a superuser.
    """
    delete_user(user_id)


@mathesar_rpc_method(name="users.get", auth="login")
def get(*, user_id: int) -> UserInfo:
    """
    List information about a mathesar user.

    Args:
        user_id: The Django id of the user.

    Returns:
        User information for a given user_id.
    """
    user = get_user(user_id)
    return UserInfo.from_model(user)


@mathesar_rpc_method(name='users.list', auth="login")
def list_() -> list[UserInfo]:
    """
    List information about all mathesar users. Exposed as `list`.

    Returns:
        A list of information about mathesar users.
    """
    users = list_users()
    return [UserInfo.from_model(user) for user in users]


@mathesar_rpc_method(name='users.patch_self', auth="login")
def patch_self(
    *,
    username: str,
    email: str,
    full_name: str,
    display_language: str,
    **kwargs
) -> UserInfo:
    """
    Alter details of currently logged in mathesar user.

    Args:
        username: The username of the user.
        email: The email of the user.
        full_name: The full name of the user.
        display_language: Specifies the display language for the user, can be set to either `en` or `ja`.

    Returns:
        Updated user information of the caller.
    """
    user = kwargs.get(REQUEST_KEY).user
    updated_user_info = update_self_user_info(
        user_id=user.id,
        username=username,
        email=email,
        full_name=full_name,
        display_language=display_language
    )
    return UserInfo.from_model(updated_user_info)


@mathesar_rpc_method(name='users.patch_other')
def patch_other(
    *,
    user_id: int,
    username: str,
    is_superuser: bool,
    email: str,
    full_name: str,
    display_language: str
) -> UserInfo:
    """
    Alter details of a mathesar user, given its user_id.

    Args:
        user_id: The Django id of the user.
        username: The username of the user.
        email: The email of the user.
        is_superuser: Specifies whether to set the user as a superuser.
        full_name: The full name of the user.
        display_language: Specifies the display language for the user, can be set to either `en` or `ja`.

    Privileges:
        This endpoint requires the caller to be a superuser.

    Returns:
        Updated user information for a given user_id.
    """
    updated_user_info = update_other_user_info(
        user_id=user_id,
        username=username,
        is_superuser=is_superuser,
        email=email,
        full_name=full_name,
        display_language=display_language
    )
    return UserInfo.from_model(updated_user_info)


@mathesar_rpc_method(name='users.password.replace_own', auth="login")
def replace_own(
    *,
    old_password: str,
    new_password: str,
    **kwargs
) -> None:
    """
    Alter password of currently logged in mathesar user.

    Args:
        old_password: Old password of the currently logged in user.
        new_password: New password of the user to set.
    """
    user = kwargs.get(REQUEST_KEY).user
    if not user.check_password(old_password):
        raise Exception('Old password is incorrect')
    change_password(user.id, new_password)


@mathesar_rpc_method(name='users.password.revoke')
def revoke(
    *,
    user_id: int,
    new_password: str,
) -> None:
    """
    Alter password of a mathesar user, given its user_id.

    Args:
        user_id: The Django id of the user.
        new_password: New password of the user to set.

    Privileges:
        This endpoint requires the caller to be a superuser.
    """
    revoke_password(user_id, new_password)
