from db.transforms.base import UnprocessedTransform

def get_processed_transformations(db_query):
    """
    Processes db_query's transformations and returns them. Resulting sequence is the db_query's
    transform sequence, but each unprocessed transform is replaced with a transform that's the
    result of processing the unprocessed transform.

    See UnprocessedTransform for more information.
    """
    return tuple(
        _get_processed_transformation(db_query, ix, db_transformation)
        for ix, db_transformation
        in enumerate(db_query.transformations)
    )

def _get_processed_transformation(db_query, ix, db_transformation):
    if isinstance(db_transformation, UnprocessedTransform):
        db_transformation = db_transformation.get_processed(
            db_query, index_in_transformation_pipeline=ix
        )
    return db_transformation
