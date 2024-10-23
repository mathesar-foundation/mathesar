from db.transforms.base import Summarize
from db.transforms.operations.finish_specifying import finish_specifying_summarize_transform


def get_transforms_with_summarizes_speced(db_query, engine, metadata):
    """
    Processes db_query's transformations, each summarization spec is finished, if it is partial.
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
