from collections import namedtuple
from sqlalchemy import select
from db.columns import utils as col_utils
from db.records.exceptions import BadSortFormat, SortFieldNotFound


def get_default_order_by(relation, order_by=None):
    if order_by is None:
        order_by = []
    # appending primary key sort guarantees determinism
    order_by = _append_primary_key_sort(relation, order_by)
    if not order_by:
        # This is a last-ditch attempt to guarantee determinism
        order_by = _build_order_by_all_columns_clause(relation)
    return order_by


def _append_primary_key_sort(relation, order_by):
    """
    Given an order by clause, we can guarantee a deterministic ordering
    overall by appending a final ordering by primary key if one exists.
    """
    pk_cols = col_utils.get_primary_key_column_collection_from_relation(relation)
    if pk_cols is not None:
        order_by += [
            {'field': col, 'direction': 'asc'}
            for col
            in set(pk_cols).intersection(relation.columns)
        ]
    return order_by


def _build_order_by_all_columns_clause(relation):
    """
    To be used when we have failed to find any other ordering criteria,
    since ordering by all columns is inherently inefficient.
    """
    return [
        {'field': col, 'direction': 'asc'}
        for col
        in relation.columns
    ]


def apply_relation_sorting(relation, sort_spec):
    order_by_list = [
        _get_sorted_column_obj_from_spec(relation, spec) for spec in sort_spec
    ]
    return select(relation).order_by(*order_by_list)


def _get_sorted_column_obj_from_spec(relation, spec):
    try:
        sort_spec = _deserialize_sort_spec(spec)
    except (KeyError, TypeError, AssertionError):
        raise BadSortFormat

    try:
        column = col_utils.get_column_obj_from_relation(relation, sort_spec.field)
    except KeyError as e:
        raise SortFieldNotFound(e)
    except AttributeError:
        raise BadSortFormat

    try:
        directed_col = _build_directed_column_expr(column, sort_spec)
    except AttributeError:
        raise BadSortFormat

    return directed_col


def _deserialize_sort_spec(spec):
    sort_spec = namedtuple(
        '_sort_spec',
        ['field', 'direction', 'nullsfirst', 'nullslast']
    )(
        field=spec['field'],
        direction=spec['direction'],
        nullsfirst=spec.get('nullsfirst', False),
        nullslast=spec.get('nullslast', False)
    )
    # Since it's not valid to have both nullsfirst and nullslast.
    assert not sort_spec.nullsfirst or not sort_spec.nullslast
    return sort_spec


def _build_directed_column_expr(column, sort_spec):
    directed_col = getattr(column, sort_spec.direction)()
    if sort_spec.nullsfirst:
        directed_col = directed_col.nulls_first()
    elif sort_spec.nullslast:
        directed_col = directed_col.nulls_last()
    return directed_col
