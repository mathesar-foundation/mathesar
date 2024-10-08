from mathesar.api.utils import get_table_or_404
from mathesar.api.permission_utils import TableAccessInspector

# These are available to all AccessPolicy instances
# https://rsinger86.github.io/drf-access-policy/reusable_conditions/


def is_superuser(request, view, action):
    return request.user.is_superuser


def is_self(request, view, action):
    user = view.get_object()
    return request.user == user


def is_atleast_manager_nested_table_resource(request, view, action):
    table = get_table_or_404(view.kwargs['table_pk'])
    return TableAccessInspector(request.user, table).is_atleast_manager()


def is_atleast_editor_nested_table_resource(request, view, action):
    table = get_table_or_404(view.kwargs['table_pk'])
    return TableAccessInspector(request.user, table).is_atleast_editor()
