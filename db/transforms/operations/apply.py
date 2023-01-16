from db.transforms.base import enforce_relation_type_expectations, Transform
from db.transforms import base


def apply_transformations(relation, transformations):
    enforce_relation_type_expectations(relation)
    for transform in transformations:
        relation = _apply_transform(relation, transform)
    return relation


def _apply_transform(relation, transform):
    assert isinstance(transform, Transform)
    relation = transform.apply_to_relation(relation)
    enforce_relation_type_expectations(relation)
    return relation


# NOTE deprecated; this will be replaced with apply_transformations
def apply_transformations_deprecated(
    table,
    limit=None,
    offset=None,
    order_by=None,
    filter=None,
    columns_to_select=None,
    group_by=None,
    duplicate_only=None,
    search=None,
    fallback_to_default_ordering=False,
):
    """
    ## Regarding ordering

    The `fallback_to_default_ordering` flag, when true, will make sure that the ordering is total,
    even if `order_by` is not provided. When `order_by` is provided, it will be converted into a
    total ordering automatically. As a consequence, the ordering is always total.

    At the same time, when both `order_by` and `fallback_to_default_ordering` are falsy, an ordering
    will not be applied. This is useful, when `table` has already been pre-sorted (e.g. because it's
    actually the result of a DBQuery that defines an ordering that we don't want to override).
    """
    # TODO rename the actual method parameter
    if search is None:
        search = []
    relation = table

    enforce_relation_type_expectations(relation)

    transforms = []

    if filter:
        transforms.append(base.Filter(filter))
    if duplicate_only:
        transforms.append(base.DuplicateOnly(duplicate_only))
    if group_by:
        transforms.append(base.Group(group_by))
    if order_by or fallback_to_default_ordering:
        transforms.append(base.Order(order_by))
    if search:
        transforms.append(base.Search([search, limit]))
    if columns_to_select:
        transforms.append(base.SelectSubsetOfColumns(columns_to_select))
    if offset:
        transforms.append(base.Offset(offset))
    if limit:
        transforms.append(base.Limit(limit))

    relation = apply_transformations(relation, transforms)
    return relation
