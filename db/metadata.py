from sqlalchemy import MetaData
from db.constraints.utils import naming_convention


def get_empty_metadata():
    """
    Returns an empty MetaData instance with our custom naming conventions.

    This is probably the only way you'll want to instantiate MetaData in this codebase.
    """
    return MetaData(naming_convention=naming_convention)
