from db.deprecated.transforms.base import enforce_relation_type_expectations, Transform
from db.deprecated.transforms import base


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


def apply_transformations_deprecated(
    table,
    limit=None,
    offset=None,
    columns_to_select=None,
    fallback_to_default_ordering=False,
):
    relation = table
    enforce_relation_type_expectations(relation)

    transforms = []

    if fallback_to_default_ordering:
        transforms.append(base.Order([]))
    if columns_to_select:
        transforms.append(base.SelectSubsetOfColumns(columns_to_select))
    if offset:
        transforms.append(base.Offset(offset))
    if limit:
        transforms.append(base.Limit(limit))

    relation = apply_transformations(relation, transforms)
    return relation
