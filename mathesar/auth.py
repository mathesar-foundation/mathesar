from django.http import HttpRequest, HttpResponse, JsonResponse
from django.contrib.auth.views import redirect_to_login
from functools import wraps
from mathesar.models.base import Form, ColumnMetaData
from typing import Callable, Protocol, Any, Optional

from mathesar.utils.download_links import get_public_form_conf_for_file_backend


# Auth checks are currently not centralized. Refer https://github.com/mathesar-foundation/mathesar/issues/4846.

class Guard(Protocol):
    def __call__(self, request: HttpRequest) -> bool:
        ...


def any_of(*guards: Guard) -> Guard:
    def _g(request: HttpRequest) -> bool:
        return any(g(request) for g in guards)
    return _g


def all_of(*guards: Guard) -> Guard:
    def _g(request: HttpRequest) -> bool:
        return all(g(request) for g in guards)
    return _g


def require(guard: Guard, *, unauthorized_response: str = "redirect_to_login") -> Callable:
    """
    Decorator: allow if `guard(request)` is True, else 401.

    `unauthorized_response` can be:
        - `redirect_to_login` (default)
        - `http_status`
        - `json`
    """
    def decorator(view_func: Callable) -> Callable:
        @wraps(view_func)
        def wrapped(request: HttpRequest, *args: Any, **kwargs: Any):
            if guard(request):
                return view_func(request, *args, **kwargs)
            return _unauthorized_response(request, unauthorized_response)
        return wrapped
    return decorator


def _unauthorized_response(request: HttpRequest, response_mode) -> HttpResponse:
    if response_mode == "json":
        return JsonResponse({"detail": "Unauthorized"}, status=401)

    if response_mode == "http_status":
        return HttpResponse("Unauthorized", status=401)

    return redirect_to_login(request.get_full_path())


def user_is_logged_in(request: HttpRequest) -> bool:
    """Checks if user is authenticated"""
    user = getattr(request, "user", None)
    return bool(user and user.is_authenticated)


def has_shared_form(request: HttpRequest) -> bool:
    """
    Checks if a valid shared form token is present in the request
    query params via `?form_token=...`
    """
    return _get_publicly_shared_form_from_request(request) is not None


def user_has_file_backend_access(request: HttpRequest) -> bool:
    if user_is_logged_in(request):
        return True

    if has_shared_form(request):
        public_form_conf_for_file_backend = get_public_form_conf_for_file_backend()
        return bool(public_form_conf_for_file_backend.get("enabled", False))

    return False


# This logic is in place because of the way the "File" type is architected.
# From the user's perspective, a file column is no different from any other column,
# however, internally, a "file" column is determined by whether its metadata contains
# a "file_backend".
#
# Eventually, we'd have to decouple "file_backend" metadata from UI type determination logic.
def shared_form_field_column_has_file_backend(request):
    """
    Checks if a field with a file backend is present in a valid shared form detected
    by the query params `?form_token=...&form_field_key=...`
    """
    form_model = _get_publicly_shared_form_from_request(request)
    if not form_model:
        return False

    field_key = request.GET.get("form_field_key")
    if not field_key:
        return False

    form_field = form_model.fields.get(key=field_key)
    if not (form_field and form_field.column_attnum):
        return False

    table_oid = form_field.parent_field.related_table_oid if form_field.parent_field else form_model.base_table_oid
    column_metadata = ColumnMetaData.objects.filter(
        attnum=form_field.column_attnum,
        table_oid=table_oid,
        database=form_model.database
    ).first()
    return bool(getattr(column_metadata, "file_backend", None))


def _get_publicly_shared_form_from_request(request: HttpRequest) -> Optional["Form"]:
    """
    Returns a cached instance of the shared form, or retrieves it and caches
    it in the request object.

    The form is identified via the request query param `form_token`, and is
    only cached/returned if it is valid and shared publicly.
    """
    SHARED_FORM_CACHE_KEY = "_shared_form_cached"

    # `None` is a valid value here, we're only validating if the attr is present.
    if hasattr(request, SHARED_FORM_CACHE_KEY):
        return getattr(request, SHARED_FORM_CACHE_KEY)

    token = request.GET.get("form_token")
    if not token:
        setattr(request, SHARED_FORM_CACHE_KEY, None)
        return None

    form = Form.objects.filter(token=token, publish_public=True).first()
    setattr(request, SHARED_FORM_CACHE_KEY, form)
    return form


# Mathesar specific guards

FILE_ACCESS_VIA_LOGIN_OR_SHARED_FORM_FIELD: Guard = (
    any_of(
        user_is_logged_in,
        all_of(
            user_has_file_backend_access,
            shared_form_field_column_has_file_backend
        ),
    )
)
