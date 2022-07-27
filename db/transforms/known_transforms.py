"""
Exports the known_transforms variable, which describes what `Transform` concrete subclasses the
library is aware of.

These variables were broken off into a discrete module to avoid circular imports.
"""

import inspect

from db.utils import get_module_members_that_satisfy

import db.transforms.base

from db.transforms.base import Transform, get_transform_type_enum_from_id


def _is_concrete_transform_subclass(member):
    return (
        inspect.isclass(member)
        and issubclass(member, Transform)
        and not inspect.isabstract(member)
    )


_modules_to_search_in = tuple([
    db.transforms.base,
])


known_transforms = tuple(
    set.union(*[
        get_module_members_that_satisfy(
            module,
            _is_concrete_transform_subclass
        )
        for module in _modules_to_search_in
    ])
)


def get_transform_subclass_from_type_enum(transform_type):
    """
    Each TransformType enumeration represents a single, concrete Transform subclass.
    """
    for known_transform in known_transforms:
        if transform_type.id == known_transform.type:
            return known_transform
    raise Exception(
        "Must never happen; this TransformType does not have a corresponding"
        " Transform subclass with it as the type attribute."
    )


def get_transform_subclass_from_type_id(transform_type_id):
    transform_type = get_transform_type_enum_from_id(transform_type_id)
    transform_subclass = get_transform_subclass_from_type_enum(transform_type)
    return transform_subclass
