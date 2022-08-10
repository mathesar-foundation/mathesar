import inspect
from db.engine import get_dummy_engine
from db.types.base import PostgresType, MathesarCustomType, UnknownDbTypeId


def get_db_type_enum_from_id(db_type_id):
    """
    Gets an instance of either the PostgresType enum or the MathesarCustomType enum corresponding
    to the provided db_type_id. If the id doesn't correspond to any of the mentioned enums,
    returns None.

    Input is case insensitive, because sometimes all-caps is used, while the canonical is all lower caps.
    """
    db_type_id = db_type_id.lower()
    try:
        return PostgresType(db_type_id)
    except ValueError:
        try:
            return MathesarCustomType(db_type_id)
        except ValueError:
            return None


# NOTE it is confusing to need an instance of engine here, since we usually use engines for making
# actual queries; it's a smell to see an engine being needed where we don't make a query.
# TODO consider alternatives.
def get_db_type_enum_from_class(sa_type):
    if not inspect.isclass(sa_type):
        # Instead of extracting classes from instances, we're supporting a single type of parameter
        # and failing early so that the codebase is more homogenous.
        raise Exception("Programming error: sa_type parameter must be a class, not an instance.")
    db_type_id = _sa_type_class_to_db_type_id(sa_type)
    if db_type_id:
        db_type = get_db_type_enum_from_id(db_type_id)
        if db_type:
            return db_type
    raise UnknownDbTypeId


def _sa_type_class_to_db_type_id(sa_type_class):
    return _get_sa_type_class_id_from_ischema_names(sa_type_class)


def _get_sa_type_class_id_from_ischema_names(sa_type_class1):
    # NOTE possibly worth caching (or instantiating earlier)
    dummy_engine = get_dummy_engine()
    for db_type_id, sa_type_class2 in dummy_engine.dialect.ischema_names.items():
        if sa_type_class1 == sa_type_class2:
            return db_type_id
