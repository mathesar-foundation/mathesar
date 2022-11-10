from db.transforms.base import PossiblyPartialTransform


def get_processed_transformations(db_query):
    """
    Processes db_query's transformations and returns them. Resulting sequence is the db_query's
    transform sequence, but each possibly partial transform is replaced with a transform that's the
    result of processing it.

    See PossiblyPartialTransform for more information.
    """
    return tuple(
        _get_processed_transformation(db_query, ix, db_transformation)
        for ix, db_transformation
        in enumerate(db_query.transformations)
    )


def _get_processed_transformation(db_query, ix, db_transformation):
    if isinstance(db_transformation, PossiblyPartialTransform):
        db_transformation = db_transformation.get_processed(
            db_query, ix_in_transform_pipeline=ix
        )
    return db_transformation
