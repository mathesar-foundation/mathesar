from db.identifiers import truncate_if_necessary
from db.constants import COLUMN_NAME_TEMPLATE


def process_column_names(column_names):
    column_names = (
        column_name.strip()
        for column_name
        in column_names
    )
    column_names = (
        truncate_if_necessary(column_name)
        for column_name
        in column_names
    )
    column_names = (
        f"{COLUMN_NAME_TEMPLATE}{i}" if name == '' else name
        for i, name
        in enumerate(column_names)
    )
    return list(column_names)
