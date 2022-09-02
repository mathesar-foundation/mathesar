from sqlalchemy import MetaData
from db.constraints.utils import naming_convention

_metadata_cache = MetaData(naming_convention=naming_convention)

def get_metadata():
    """
    Cached to minimize reflection queries to Postgres.
    """
    return _metadata_cache
