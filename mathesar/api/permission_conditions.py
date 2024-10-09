# These are available to all AccessPolicy instances
# https://rsinger86.github.io/drf-access-policy/reusable_conditions/


def is_superuser(request, view, action):
    return request.user.is_superuser


def is_self(request, view, action):
    user = view.get_object()
    return request.user == user
