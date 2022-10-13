from sqlalchemy import select
from db.columns.utils import get_column_obj_from_relation


def apply_relation_sorting(relation, sort_spec):
    order_by_list = [
        _get_sorted_column_obj_from_spec(relation, spec) for spec in sort_spec
    ]
    return select(relation).order_by(*order_by_list)


def _get_sorted_column_obj_from_spec(relation, spec):
    column = get_column_obj_from_relation(relation, spec['field'])
    return getattr(column, spec['direction'])()
