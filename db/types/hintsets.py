from frozendict import frozendict

from db.functions import hints
from db.types import categories
from db.types.base import PostgresType, MathesarCustomType, known_db_types


# TODO switch from using tuples for hintsets to using frozensets
def _build_db_types_hinted():
    """
    Builds up a map of db types to hintsets.
    """
    # Start out by defining some hints manually.
    db_types_hinted = {
        PostgresType.BOOLEAN: tuple([
            hints.boolean
        ]),
        MathesarCustomType.URI: tuple([
            hints.uri
        ]),
        MathesarCustomType.EMAIL: tuple([
            hints.email
        ]),
    }

    # Then, start adding hints automatically.
    # This is for many-to-many relationships, i.e. adding multiple identical hintsets to the
    # hintsets of multiple db types.
    def _add_to_db_type_hintsets(db_types, hints):
        """
        Mutates db_types_hinted to map every hint in `hints` to every DB type in `db_types`.
        """
        for db_type in db_types:
            if db_type in db_types_hinted:
                updated_hintset = tuple(set(db_types_hinted[db_type] + tuple(hints)))
                db_types_hinted[db_type] = updated_hintset
            else:
                db_types_hinted[db_type] = tuple(hints)

    # all types get the "any" hint
    all_db_types = known_db_types
    _add_to_db_type_hintsets(all_db_types, (hints.any,))

    _add_to_db_type_hintsets(categories.STRING_LIKE_TYPES, (hints.string_like,))
    _add_to_db_type_hintsets(categories.TIME_OF_DAY_TYPES, (hints.time,))
    _add_to_db_type_hintsets(categories.POINT_IN_TIME_TYPES, (hints.point_in_time,))
    _add_to_db_type_hintsets(categories.DATE_TYPES, (hints.date,))
    _add_to_db_type_hintsets(categories.DATETIME_TYPES, (hints.date, hints.time,))
    _add_to_db_type_hintsets(categories.DURATION_TYPES, (hints.duration,))
    _add_to_db_type_hintsets(categories.COMPARABLE_TYPES, (hints.comparable,))
    _add_to_db_type_hintsets(categories.INTEGER_TYPES, (hints.integer,))

    # TODO do we want JSON_ARRAY and ARRAY distinct here?
    _add_to_db_type_hintsets(categories.JSON_ARRAY, (hints.json_array,))
    _add_to_db_type_hintsets(categories.ARRAY, (hints.array,))

    return frozendict(db_types_hinted)


db_types_hinted = _build_db_types_hinted()
