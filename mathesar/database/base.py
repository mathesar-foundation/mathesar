from db import engine


# TODO get rid of this; not doing it now because want to minimize changes in
# demo namespace (because they're hard to test).
def create_mathesar_engine(credentials):
    """
    Create an SQLAlchemy engine using passed credentials.

    If you're considering using this, you probably should use
    `mathesar.state.get_cached_engine` instead.
    """
    return engine.create_future_engine_with_custom_types(credentials)
