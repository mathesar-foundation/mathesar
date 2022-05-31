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
    """
    Simplifies creating multiple identical, but differently scoped, fixtures.

    For every pytest fixture scope, creates a fixture with that scope, with the body of
    `fixture_impl_function`, and the name of `fixture_impl_function` prepended with `FUN_`, `CLA_`,
    `MOD_` or `SES_` (depending on resulting scope), and then adds that fixture to the provided
    `globals` dict.

    E.g. given a fixture implementation function named `create_db`, this will add 4 fixtures
    to the passed `globals` dict: a function-scoped `FUN_create_db`, a class-scoped `CLA_create_db`,
    a module-scoped `MOD_create_db`, and a session-scoped `SES_create_db`.

    Since this method is adding dynamically-named stuff to `globals()`, a developer might have a
    hard time understanding where a given global member is being defined. To help with that, we
    prepend a comment to the `create_scoped_fixtures` call that lists the global variables it is
    expected to introduce, like so:

    ```
    # defines:
    # FUN_create_dj_db
    # CLA_create_dj_db
    # MOD_create_dj_db
    # SES_create_dj_db
    create_scoped_fixtures(globals(), create_dj_db)
    ```
    """
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
