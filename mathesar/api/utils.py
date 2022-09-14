from rest_framework.exceptions import NotFound
import mathesar.api.exceptions.generic_exceptions.base_exceptions as generic_api_exceptions
import re

from db.records.operations import group
from mathesar.api.exceptions.error_codes import ErrorCodes
from mathesar.models.base import Table
from mathesar.utils.preview import column_alias_from_preview_template

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
        raise generic_api_exceptions.NotFoundAPIException(
            NotFound,
            error_code=ErrorCodes.TableNotFound.value,
            message="Table doesn't exist"
        )
    return table


def process_annotated_records(record_list, column_name_id_map=None, preview_metadata=None):

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
            # TODO why are we doing this catch? is this in case group_metadata_item is None? we
            # should use an explicit None check in that case.
            processed_group_metadata_item = group_metadata_item
        return processed_group_metadata_item

    def _use_correct_column_identifier(group_metadata_item):
        """
        If column_name_id_map is defined, the identifier to use is the column's Django ID. If
        column_name_id_map is None, the identifier to use is the column's name/alias, in which
        case, no processing is needed.
        """
        if column_name_id_map is not None:
            return _replace_column_names_with_ids(group_metadata_item)
        else:
            return group_metadata_item
    if preview_metadata:
        # Extract preview data from the records
        # TODO Replace modifying the parameter directly
        for preview_colum_id, preview_info in preview_metadata.items():
            preview_template = preview_info['template']
            # TODO Move the unwanted field preprocessing step to a suitable place
            preview_metadata[preview_colum_id].pop('path')
            # Move column id into the object so that dict can be flattened into a list
            preview_metadata[preview_colum_id]['column'] = preview_colum_id
            preview_data_column_aliases = column_alias_from_preview_template(preview_template)
            preview_records = []
            for record_index, record in enumerate(processed_records):
                column_preview_data = {}
                for preview_data_column_alias in preview_data_column_aliases:
                    preview_value = processed_records[record_index].pop(preview_data_column_alias)
                    column_preview_data.update({preview_data_column_alias: preview_value})
                preview_records.append(column_preview_data)
            preview_metadata[preview_colum_id]['data'] = preview_records
        # Flatten the preview objects
        preview_metadata = preview_metadata.values()

    if groups is not None:
        groups_by_id = {
            grp[group.GroupMetadataField.GROUP_ID.value]: {
                k: _use_correct_column_identifier(v) for k, v in grp.items()
                if k != group.GroupMetadataField.GROUP_ID.value
            } | {RESULT_IDX: []}
            for grp in groups
        }

        for i, meta in enumerate(record_metadata):
            groups_by_id[meta[group.GroupMetadataField.GROUP_ID.value]][RESULT_IDX].append(i)

        output_groups = sorted(list(groups_by_id.values()), key=lambda x: x[RESULT_IDX][0])
    else:
        output_groups = None

    return processed_records, output_groups, preview_metadata


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
