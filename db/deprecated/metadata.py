from sqlalchemy import MetaData


def get_empty_metadata():
    """
    Returns an empty MetaData instance with our custom naming conventions.

    This is probably the only way you'll want to instantiate MetaData in this codebase.
    """
    return MetaData()
