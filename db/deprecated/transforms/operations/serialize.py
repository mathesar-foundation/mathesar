def serialize_transformation(transform):
    return dict(
        type=transform.type,
        spec=transform.spec,
    )
