"""
Exports the known_transforms variable, which describes what `Transform` concrete subclasses the
library is aware of.

These variables were broken off into a discrete module to avoid circular imports.
"""

import inspect

from db.deprecated.utils import get_module_members_that_satisfy

import db.deprecated.transforms.base

from db.deprecated.transforms.base import Transform


def _is_concrete_transform_subclass(member):
    return (
        inspect.isclass(member)
        and issubclass(member, Transform)
        and not inspect.isabstract(member)
    )


_modules_to_search_in = tuple([
    db.deprecated.transforms.base,
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


def get_transform_subclass_from_type_id(transform_type_id):
    """
    Each concrete Transform subclass has a unique transform type identifier. Use that as key.
    """
    for known_transform in known_transforms:
        if transform_type_id == known_transform.type:
            return known_transform
    raise Exception(
        "Must never happen; this transform type does not have a corresponding"
        " Transform subclass with it as the type attribute."
    )
