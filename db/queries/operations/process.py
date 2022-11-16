from db.transforms.base import Summarize


def get_transforms_with_summarizes_speced(db_query):
    """
    Processes db_query's transformations and returns them. Resulting sequence is the db_query's
    transform sequence, but each possibly partial transform is replaced with a transform that's the
    result of processing it.

    See PossiblyPartialTransform for more information.
    """
    def _map(db_query, ix, db_transformation):
        if isinstance(db_transformation, Summarize):
            # TODO call finish_specifying_summarize_transform, once the other PR is merged in
            return db_transformation
        return db_transformation
    return tuple(
        _map(db_query, ix, db_transformation)
        #_get_processed_transformation(db_query, ix, db_transformation)
        for ix, db_transformation
        in enumerate(db_query.transformations)
    )


