def convert_preview_data_to_db_identifier(preview_columns):
    identifier_converted_preview_data = None
    if preview_columns:
        identifier_converted_preview_data = {}
        for preview_column, preview_info in preview_columns.items():
            converted_preview_info = {}
            preview_data_columns = preview_info['columns']
            converted_preview_info['columns'] = [
                preview_data_column.name
                for preview_data_column in preview_data_columns
            ]
            converted_preview_info['referent_column'] = preview_info['referent_column'].name
            converted_preview_info['table'] = preview_info['table']._sa_table
            identifier_converted_preview_data[preview_column.name] = converted_preview_info
    return identifier_converted_preview_data
