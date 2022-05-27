import pytest


def get_fixture_value(request, fixture_impl_function):
    """
    A way to have fixtures whose scope dynamically matches that of the caller. Pytest does not
    provide dynamicly-scoped fixtures: this is a workaround for that.

    Scoped variants of the fixture must already have been created using `create_scoped_fixtures`.
    """
    scope = request.scope
    scoped_fixture_name = _get_scoped_fixture_name(fixture_impl_function, scope)
    return request.getfixturevalue(scoped_fixture_name)


def create_scoped_fixtures(globals, fixture_impl_function):
    for scope in ('function', 'class', 'module', 'session'):
        scoped_fixture_name = _get_scoped_fixture_name(fixture_impl_function, scope)
        globals[scoped_fixture_name] = pytest.fixture(
            fixture_impl_function,
            scope=scope,
            name=scoped_fixture_name
        )


def _get_scoped_fixture_name(fixture_impl_function, scope):
    """
    Produces names like "FUN_some_fixture", "FUN" signifying the "function" scope.
    """
    shorthand = {
        'function': 'FUN',
        'class': 'CLA',
        'module': 'MOD',
        'session': 'SES',
    }.get(scope)
    assert shorthand is not None
    fixture_impl_name = _get_function_name(fixture_impl_function)
    scoped_fixture_name = shorthand + '_' + fixture_impl_name
    return scoped_fixture_name


def _get_function_name(f):
    return f.__name__
