def create_col_objects(table, column_list):
    return [
        table.columns[col] if type(col) == str else table.columns[col.name]
        for col in column_list
    ]
