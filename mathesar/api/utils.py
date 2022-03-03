from bidict import bidict
from rest_framework.exceptions import NotFound

from db.records.operations import group
from mathesar.models import Column, Table

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

    RESULT_IDX = 'result_indices'

    def _get_record_dict(record):
        return record._asdict() if not isinstance(record, dict) else record

    split_records = (
        {DATA_KEY: record_dict}
        for record_dict in (_get_record_dict(record) for record in record_list)
    )

    combined_records, groups = group.extract_group_metadata(
        split_records, data_key=DATA_KEY, metadata_key=METADATA_KEY
    )

    processed_records, record_metadata = zip(
        *tuple(tuple(d.values()) for d in combined_records)
    )

    if groups is not None:
        groups_by_id = {
            grp[group.GroupMetadataField.GROUP_ID.value]: {
                k: v for k, v in grp.items()
                if k != group.GroupMetadataField.GROUP_ID.value
            } | {RESULT_IDX: []}
            for grp in groups
        }

        for i, meta in enumerate(record_metadata):
            groups_by_id[meta[group.GroupMetadataField.GROUP_ID.value]][RESULT_IDX].append(i)

        output_groups = sorted(list(groups_by_id.values()), key=lambda x: x[RESULT_IDX][0])
    else:
        output_groups = None

    return processed_records, output_groups

