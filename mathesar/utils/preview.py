import re

from db.constraints.utils import ConstraintType
from mathesar.models.base import Column, Constraint, Table


def _preview_info_by_column_id(fk_constraints, previous_path=None, exising_columns=None):
    if previous_path is None:
        previous_path = []
    if exising_columns is None:
        exising_columns = []
    preview_info = {}
    preview_columns = exising_columns
    for fk_constraint in fk_constraints:
        constrained_column = fk_constraint.columns[0]
        # For now only single column foreign key is used.
        referent_column = fk_constraint.referent_columns[0]
        referent_table = Table.objects.select_related('settings__preview_settings').get(id=referent_column.table_id)
        referent_table_settings = referent_table.settings
        preview_template = referent_table_settings.preview_settings.template
        preview_data_column_ids = column_ids_from_preview_template(preview_template)
        preview_data_columns = Column.objects.filter(id__in=preview_data_column_ids)
        current_position = (constrained_column.id, referent_column.id)
        current_path = previous_path + [current_position]
        # Extract the template for foreign key columns of the referent table
        referent_preview_info, referent_preview_columns = get_preview_info(
            referent_table.id,
            preview_data_columns,
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
                initial_column = {'id': preview_data_column_id, "alias": column_alias_name, "jp_path": current_path}
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


def get_preview_info(referrer_table_pk, restrict_columns=None, path=None, existing_columns=None):
    if path is None:
        path = []
    if existing_columns is None:
        existing_columns = []
    table_constraints = Constraint.objects.filter(table_id=referrer_table_pk).select_related('table__schema__database')
    fk_constraints = [
        table_constraint
        for table_constraint in table_constraints
        if table_constraint.type == ConstraintType.FOREIGN_KEY.value
    ]
    if restrict_columns:
        fk_constraints = filter(
            _get_filter_restricted_columns_fn(restrict_columns),
            fk_constraints
        )
    fk_constraints = filter(
        _get_filter_out_circular_dependency_columns_fn(path),
        fk_constraints
    )

    preview_info, columns = _preview_info_by_column_id(
        fk_constraints,
        path,
        existing_columns
    )
    return preview_info, columns


def _get_filter_restricted_columns_fn(restricted_columns):
    def _filter_restricted_columns(fk_constraint):
        constrained_column = fk_constraint.columns[0]
        return constrained_column in restricted_columns

    return _filter_restricted_columns


def _get_filter_out_circular_dependency_columns_fn(path):

    def _filter_out_circular_dependency_columns(fk_constraint):
        constrained_column = fk_constraint.columns[0]
        referent_column = fk_constraint.referent_columns[0]
        return (constrained_column.id, referent_column.id) not in path

    return _filter_out_circular_dependency_columns
