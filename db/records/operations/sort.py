from sqlalchemy import select
from db.columns.utils import get_column_obj_from_relation


def apply_relation_sorting(relation, sort_spec):
    order_by_list = [
        _get_sorted_column_obj_from_spec(relation, spec) for spec in sort_spec
    ]
    return select(relation).order_by(*order_by_list)


def _get_sorted_column_obj_from_spec(relation, spec):
    try:
        field = spec['field']
        direction = spec['direction']
        nullsfirst = spec.get('nullsfirst', False)
        nullslast = spec.get('nullslast', False)
        assert not nullsfirst or not nullslast
    except (KeyError, TypeError, AssertionError):
        raise BadSortFormat

    try:
        column = get_column_obj_from_relation(relation, field)
    except KeyError:
        raise SortFieldNotFound
    except AttributeError:
        raise BadSortFormat

    try:
        directed_col = getattr(column, direction)()
        if nullsfirst:
            directed_col = directed_col.nulls_first()
        elif nullslast:
            directed_col = directed_col.nulls_last()
        return directed_col

    except AttributeError:
        raise BadSortFormat


class BadSortFormat(Exception):
    pass


class SortFieldNotFound(Exception):
    pass
