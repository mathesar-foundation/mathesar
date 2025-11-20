"""
RPC endpoints for managing Mathesar users.

This module exposes RPC methods for creating users, listing users, updating
profile information, and modifying passwords.
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
    revoke_password,
)


class UserInfo(TypedDict):
    """
    Information about a Mathesar user.

    Attributes:
        id: The Django ID of the user.
        username: The username of the user.
        is_superuser: Whether the user is a superuser.
        email: The user's email address.
        full_name: The user's full name.
        display_language: The UI display language (`en` or `ja`).
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
            display_language=model.display_language,
        )


class UserDef(TypedDict):
    """
    Definition for creating a new Mathesar user.

    Attributes:
        username: Desired username.
        password: Password for the user.
        is_superuser: Whether the user should be a superuser.
        email: Optional email address.
        full_name: Optional full name.
        display_language: Optional display language (`en` or `ja`).
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
    Create a new Mathesar user.

    Args:
        user_def: Dictionary containing the fields required to create the user.

    Privileges:
        Requires superuser privileges.

    Returns:
        UserInfo: Information about the newly created user.
    """
    user = add_user(user_def)
    return UserInfo.from_model(user)


@mathesar_rpc_method(name='users.delete')
def delete(*, user_id: int) -> None:
    """
    Delete a Mathesar user.

    Args:
        user_id: The Django ID of the user to delete.

    Privileges:
        Requires superuser privileges.
    """
    delete_user(user_id)


@mathesar_rpc_method(name="users.get", auth="login")
def get(*, user_id: int) -> UserInfo:
    """
    Retrieve a user's information.

    Args:
        user_id: The Django ID of the user.

    Returns:
        UserInfo: Information about the requested user.
    """
    user = get_user(user_id)
    return UserInfo.from_model(user)


@mathesar_rpc_method(name='users.list', auth="login")
def list_() -> list[UserInfo]:
    """
    List all Mathesar users.

    Returns:
        list[UserInfo]: A list of user information objects.
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
    Update the profile information of the currently logged-in user.

    Args:
        username: Updated username.
        email: Updated email address.
        full_name: Updated full name.
        display_language: Updated display language (`en` or `ja`).
        **kwargs: Additional request context passed by RPC.

    Returns:
        UserInfo: Updated information of the current user.
    """
    user = kwargs.get(REQUEST_KEY).user
    updated = update_self_user_info(
        user_id=user.id,
        username=username,
        email=email,
        full_name=full_name,
        display_language=display_language,
    )
    return UserInfo.from_model(updated)


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
    Update details of another user.

    Args:
        user_id: The Django ID of the user.
        username: Updated username.
        is_superuser: Updated superuser status.
        email: Updated email address.
        full_name: Updated full name.
        display_language: Updated display language (`en` or `ja`).

    Privileges:
        Requires superuser privileges.

    Returns:
        UserInfo: Updated information of the user.
    """
    updated = update_other_user_info(
        user_id=user_id,
        username=username,
        is_superuser=is_superuser,
        email=email,
        full_name=full_name,
        display_language=display_language,
    )
    return UserInfo.from_model(updated)


@mathesar_rpc_method(name='users.password.replace_own', auth="login")
def replace_own(
    *,
    old_password: str,
    new_password: str,
    **kwargs
) -> None:
    """
    Change the password of the currently logged-in user.

    Args:
        old_password: Current password.
        new_password: New password to set.
        **kwargs: Additional request context passed by RPC.

    Raises:
        Exception: If the old password is incorrect.
    """
    user = kwargs.get(REQUEST_KEY).user
    if not user.check_password(old_password):
        raise Exception("Old password is incorrect")
    change_password(user.id, new_password)


@mathesar_rpc_method(name='users.password.revoke')
def revoke(
    *,
    user_id: int,
    new_password: str,
) -> None:
    """
    Reset another user's password.

    Args:
        user_id: The Django ID of the user.
        new_password: New password to assign.

    Privileges:
        Requires superuser privileges.
    """
    revoke_password(user_id, new_password)
