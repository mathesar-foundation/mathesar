from db.transforms.base import Summarize
from db.transforms.operations.finish_specifying import finish_specifying_summarize_transform


def get_transforms_with_summarizes_speced(db_query, engine, metadata):
    """
    Processes db_query's transformations and returns them. Resulting sequence is the db_query's
    transform sequence, but each possibly partial transform is replaced with a transform that's the
    result of processing it.

    See PossiblyPartialTransform for more information.
    """
    def _map(db_query, ix, db_transformation):
        if isinstance(db_transformation, Summarize):
            return finish_specifying_summarize_transform(
                db_query=db_query,
                ix_of_summarize_transform=ix,
                engine=engine,
                metadata=metadata,
            )
        return db_transformation
    return tuple(
        _map(db_query, ix, db_transformation)
        for ix, db_transformation
        in enumerate(db_query.transformations)
    )


