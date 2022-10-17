import re
from collections import defaultdict, namedtuple

from db.metadata import get_empty_metadata
from db.tables.operations.select import get_joinable_tables
from mathesar.models.base import Column, Table


def _preview_info_by_column_id(
    referrer_table,
    referent_column_obj_by_column_attnum,
    prefetched_objects,
    previous_path=[],
    exising_columns=[]
):
    preview_info = {}
    preview_columns = exising_columns
    for fk_constrained_column_attnum, referent_tuple in referent_column_obj_by_column_attnum.items():
        constrained_column = next(
            constrained_column
            for constrained_column in prefetched_objects.possible_columns
            if fk_constrained_column_attnum == constrained_column.attnum and constrained_column.table.oid == referrer_table.oid
        )
        referent_column_oid = referent_tuple[1]
        referent_table_oid = referent_tuple[0]
        referent_column = next(
            referent_column
            for referent_column in prefetched_objects.possible_columns
            if referent_column_oid == referent_column.attnum and referent_column.table.oid == referent_table_oid
        )
        referent_table = next(
            table for table in prefetched_objects.possible_referent_tables if table.oid == referent_table_oid
        )

        referent_table_settings = referent_table.settings
        preview_template = referent_table_settings.preview_settings.template
        preview_data_column_ids = column_ids_from_preview_template(preview_template)
        preview_data_columns = filter(
            lambda column: column.id in preview_data_column_ids,
            prefetched_objects.possible_columns
        )
        preview_data_column_attnums = [column.attnum for column in preview_data_columns]
        current_position = [[constrained_column.id, referent_column.id]]
        current_path = previous_path + current_position
        # Extract the template for foreign key columns of the referent table
        referent_preview_info, referent_preview_columns = _get_table_preview_info(
            referent_table,
            prefetched_objects,
            preview_data_column_attnums,
            current_path,
            exising_columns
        )
        preview_columns = preview_columns + referent_preview_columns
        for column_key, column_value in referent_preview_info.items():
            # Replace the foreign key column id with the respective template of the referent table
            preview_template = preview_template.replace(f'{{{column_key}}}', f'{column_value["template"]}')
        path_prefix = compute_path_prefix(current_path)

        for preview_data_column_id in preview_data_column_ids:
            if preview_data_column_id not in referent_preview_info:
                column_alias_name = compute_path_str(path_prefix, preview_data_column_id)
                # Replace the column id in the template with the path alias
                # To avoid conflict in case of multiple column referencing same table
                preview_template = preview_template.replace(f'{{{preview_data_column_id}}}', f'{{{column_alias_name}}}')
                initial_column = {
                    'id': preview_data_column_id,
                    "alias": column_alias_name,
                    "jp_path": current_path
                }
                preview_columns.append(initial_column)
        preview_info[constrained_column.id] = {"template": preview_template, 'path': current_path}
    return preview_info, preview_columns


def compute_path_str(path_prefix, preview_data_column_id):
    column_alias_name = f'{path_prefix}__col__{preview_data_column_id}'
    return column_alias_name


def compute_path_prefix(paths):
    path_prefix = "___".join([f"{path[0]}__{path[1]}" for path in paths])
    return path_prefix


def column_ids_from_preview_template(preview_template):
    preview_data_column_str_ids = column_alias_from_preview_template(preview_template)
    preview_data_column_ids = list(map(int, preview_data_column_str_ids))
    return preview_data_column_ids


def column_alias_from_preview_template(preview_template):
    preview_columns_extraction_regex = r'\{(.*?)\}'
    preview_data_column_ids = re.findall(preview_columns_extraction_regex, preview_template)
    return preview_data_column_ids


def get_preview_info(referrer_table):
    joinable_tables = get_joinable_tables(referrer_table.schema._sa_engine, get_empty_metadata(), referrer_table.oid)
    # Some foreign key columns might not be in the summary template
    possible_summary_table_oids = []
    constrained_columns_by_table = defaultdict(dict)
    for joinable_table in joinable_tables:
        if not joinable_table.multiple_results:
            possible_summary_table_oids.append(joinable_table.target)
            for path_between_related_table in joinable_table.jp_path:
                constrained_columns_by_table[path_between_related_table[0][0]][path_between_related_table[0][1]] = \
                    path_between_related_table[1]
    possible_referent_tables = Table.objects.filter(oid__in=possible_summary_table_oids).select_related(
        'settings__preview_settings'
    )
    possible_referent_table_ids = [referrer_table.id] + [
        possible_referent_table.id
        for possible_referent_table in possible_referent_tables
    ]
    possible_columns = Column.objects.filter(table_id__in=possible_referent_table_ids).select_related('table')
    PrefetchedObjects = namedtuple(
        "PrefetchedObjects",
        "possible_referent_tables possible_columns constrained_columns_by_table"
    )
    prefetched_objects = PrefetchedObjects(
        possible_referent_tables, possible_columns, constrained_columns_by_table
    )
    return _get_table_preview_info(referrer_table, prefetched_objects)


def _get_table_preview_info(referrer_table, prefetched_objects, summary_columns=None, path=[], existing_columns=[]):
    constrained_columns_by_table = prefetched_objects.constrained_columns_by_table
    referent_columns_by_column_attnum = constrained_columns_by_table[referrer_table.oid]
    if summary_columns:
        referent_columns_by_column_attnum = dict(
            filter(
                _get_allowed_columns_filter_fn(summary_columns),
                referent_columns_by_column_attnum.items()
            )
        )

    preview_info, columns = _preview_info_by_column_id(
        referrer_table,
        referent_columns_by_column_attnum,
        prefetched_objects,
        path,
        existing_columns
    )
    return preview_info, columns


def _get_allowed_columns_filter_fn(allowed_columns):
    def allowed_columns_filter(allowed_column_item):
        return allowed_column_item[0] in allowed_columns

    return allowed_columns_filter
