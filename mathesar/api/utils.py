from rest_framework.exceptions import NotFound
import re

from db.records.operations import group
from mathesar.models.base import Table

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


def process_annotated_records(record_list, column_name_id_map):

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

    def _replace_column_names_with_ids(group_metadata_item):
        try:
            processed_group_metadata_item = {
                column_name_id_map[k]: v for k, v in group_metadata_item.items()
            }
        except AttributeError:
            processed_group_metadata_item = group_metadata_item
        return processed_group_metadata_item

    if groups is not None:
        groups_by_id = {
            grp[group.GroupMetadataField.GROUP_ID.value]: {
                k: _replace_column_names_with_ids(v) for k, v in grp.items()
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


def follows_json_number_spec(number):
    """
    Check if a string follows JSON number spec
    Args:
        number: number as string
    """
    patterns = [
        r"^-?0$",
        r"^-?0[\.][0-9]+$",
        r"^-?0[eE][+-]?[0-9]*$",
        r"^-?0[\.][0-9]+[eE][+-]?[0-9]+$",
        r"^-?[1-9][0-9]*$",
        r"^-?[1-9][0-9]*[\.][0-9]+$",
        r"^-?[1-9][0-9]*[eE][+-]?[0-9]+$",
        r"^-?[1-9][0-9]*[\.][0-9]+[eE][+-]?[0-9]+$",
    ]
    for pattern in patterns:
        if re.search(pattern, number) is not None:
            return True
    return False
