from typing import Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

from mathesar.api.exceptions import APIError
from mathesar.api.decorators import (
    rpc_method,
    http_basic_auth_superuser_required,
    handle_rpc_exceptions
)

User = get_user_model()

@rpc_method(name='users.delete')
@http_basic_auth_superuser_required
@handle_rpc_exceptions
def delete(
        *,
        user_id: int,
) -> None:

    try:
        user = User.objects.get(id=user_id)
        

        if user.is_superuser:
            superuser_count = User.objects.filter(is_superuser=True).count()
            if superuser_count <= 1:
                raise APIError(
                    "Cannot delete the last superuser.",
                    code="last_superuser_deletion_attempted",
                    status_code=400
                )
        
        user.delete()
        
    except ObjectDoesNotExist:
        raise APIError(
            f"User with ID {user_id} not found.",
            code="user_not_found",
            status_code=404
        )