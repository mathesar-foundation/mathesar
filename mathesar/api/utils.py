from rest_framework.exceptions import NotFound

from db.records.operations import group
from mathesar.models import Table

DATA_KEY = 'data'
METADATA_KEY = 'metadata'


def get_table_or_404(pk):
    """
    Get table if it exists, otherwise throws a DRF NotFound error.
    Args:
        pk: id of table
    Returns:
        table: return the table based on a specific id
    """
    try:
        table = Table.objects.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table


def process_annotated_records(record_list):

    def _get_record_dict(record):
        return record._asdict() if not isinstance(record, dict) else record

    split_records = (
        {DATA_KEY: record_dict}
        for record_dict in (_get_record_dict(record) for record in record_list)
    )
    return group.extract_group_metadata(
        split_records, data_key=DATA_KEY, metadata_key=METADATA_KEY
    )
