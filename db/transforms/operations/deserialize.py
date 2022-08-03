from db.transforms.known_transforms import get_transform_subclass_from_type_id


def deserialize_transformation(json):
    transform_type_id = json['type']
    transform_subclass = \
        get_transform_subclass_from_type_id(transform_type_id)
    spec = json['spec']
    transform = transform_subclass(spec)
    return transform
