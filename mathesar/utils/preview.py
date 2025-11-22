import re


def column_alias_from_preview_template(preview_template):
    preview_columns_extraction_regex = r'\{(.*?)\}'
    preview_data_column_ids = re.findall(preview_columns_extraction_regex, preview_template)
    return preview_data_column_ids
