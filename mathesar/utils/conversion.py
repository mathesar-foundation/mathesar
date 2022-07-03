def convert_preview_data_to_db_identifier(preview_columns):
    identifier_converted_preview_data = None
    if preview_columns:
        identifier_converted_preview_data = {}
        for preview_table_id, preview_info in preview_columns.items():
            converted_preview_info = {}
            referent_table = preview_info['table']
            converted_preview_info['table'] = referent_table._sa_table
            preview_data_columns = preview_info['preview_columns']
            converted_preview_info['preview_columns'] = [
                preview_data_column.name
                for preview_data_column in preview_data_columns
            ]
            converted_constraint_columns = []
            constraint_info = preview_info['constraint_columns']
            for constraint_info in constraint_info:
                converted_constraint_column_info = {'referent_column': constraint_info['referent_column'].name,
                                                    'constrained_column': constraint_info['constrained_column'].name}
                converted_constraint_columns.append(converted_constraint_column_info)
            converted_preview_info['constraint_columns'] = converted_constraint_columns
            identifier_converted_preview_data[referent_table.name] = converted_preview_info
    return identifier_converted_preview_data
