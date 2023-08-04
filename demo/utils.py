from django.conf import settings


def get_is_live_demo_mode():
    """
    Will return true when in live demo mode.

    We want some things to behave differently in demo mode, so sometimes we
    explicitly check whether we're in it.
    """
    return getattr(settings, 'MATHESAR_LIVE_DEMO', False)


def get_live_demo_db_name(request):
    """
    Retrieves the name of the database associated with this live demo session.

    In live demo mode, our demo-specific middleware embeds the name of
    the database generated for the user in the request object. This retrieves
    that.
    """
    return request.GET.get('demo_database_name')


def set_live_demo_db_name(request, db_name):
    """
    Embeds the db_name in the request object.

    Meant to be used in live demo mode, where we want to keep track of which
    generated database is assigned to a given session.
    """
    params = request.GET.copy()
    params.update({'demo_database_name': db_name})
    request.GET = params
    return request
