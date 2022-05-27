from collections import defaultdict

from db.records.operations.select import preview_column_key


def extract_preview_metadata(
        record_dictionaries, preview_columns
):
    preview_data = defaultdict(lambda: defaultdict(lambda: {}))
    for index, record in enumerate(record_dictionaries):
        for preview_column, referent_obj in preview_columns.items():
            for referent_column in referent_obj['columns']:
                key = preview_column_key(preview_column, referent_column)
                if record[preview_column] is not None:
                    preview_data[preview_column][str(record[preview_column])][referent_column] = record_dictionaries[
                        index].pop(key)
                else:
                    record_dictionaries[index].pop(key)
    return preview_data, record_dictionaries
