import re
from collections import defaultdict

from db.constraints.utils import ConstraintType
from mathesar.models.base import Column, Constraint, TableSettings


def add_preview_columns(preview_info, referent_table_settings):
    for referent_table_setting in referent_table_settings:
        preview_template = referent_table_setting.preview_settings.template
        preview_columns_extraction_regex = r'\{(.*?)\}'
        preview_data_column_ids = re.findall(preview_columns_extraction_regex, preview_template)
        preview_data_columns = Column.objects.filter(id__in=preview_data_column_ids)
        preview_info[referent_table_setting.table_id]['preview_columns'] = preview_data_columns
        preview_info[referent_table_setting.table_id]['table'] = referent_table_setting.table
    return preview_info


def get_constrained_columns_by_referent_table(referrer_table_pk):
    table_constraints = Constraint.objects.filter(table__id=referrer_table_pk)
    fk_constraints = [
        table_constraint
        for table_constraint in table_constraints
        if table_constraint.type == ConstraintType.FOREIGN_KEY.value
    ]
    preview_info = defaultdict(lambda: {'constraint_columns': []})
    for fk_constraint in fk_constraints:
        # For now only single column foreign key is used.
        constrained_column = fk_constraint.columns[0]
        referent_column = fk_constraint.referent_columns[0]
        referent_table_id = referent_column.table_id
        constraint_columns = {'referent_column': referent_column, 'constrained_column': constrained_column}
        preview_info[referent_table_id]['constraint_columns'].append(constraint_columns)
    return preview_info


def get_preview_info(filter_preview_enabled_columns, fk_previews, referrer_table_pk):
    constrained_columns_by_referent_table = get_constrained_columns_by_referent_table(referrer_table_pk)
    if fk_previews == 'auto':
        constrained_columns_by_referent_table = filter(
            filter_preview_enabled_columns,
            constrained_columns_by_referent_table
        )
    referent_table_ids = constrained_columns_by_referent_table.keys()
    referent_table_settings = TableSettings.objects.filter(table_id__in=referent_table_ids).select_related(
        'preview_settings',
        'table'
    )
    preview_info = add_preview_columns(
        constrained_columns_by_referent_table,
        referent_table_settings
    )
    return preview_info


def filter_preview_enabled_columns(column_constraints):
    constrained_column = column_constraints['constrained_columns']
    return constrained_column.display_options['show_fk_preview']
