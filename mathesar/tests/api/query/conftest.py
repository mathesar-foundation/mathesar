import pytest
from mathesar.models.query import UIQuery


@pytest.fixture
def academics_ma_tables(db_table_to_dj_table, academics_db_tables):
    return {
        table_name: db_table_to_dj_table(db_table)
        for table_name, db_table
        in academics_db_tables.items()
    }


@pytest.fixture
def minimal_patents_query(create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    initial_columns = [
        {
            'id': base_table.get_column_by_name('Center').id,
            'alias': 'col1',
        },
        {
            'id': base_table.get_column_by_name('Case Number').id,
            'alias': 'col2',
        },
    ]
    display_names = {
        'col1': 'Column 1',
        'col2': 'Column 2',
        'Checkout Month': 'Month',
        'Count': 'Number of Checkouts',
    }
    display_options = {
        'col1': dict(a=1),
        'col2': dict(b=2),
    }
    ui_query = UIQuery.objects.create(
        base_table=base_table,
        initial_columns=initial_columns,
        display_options=display_options,
        display_names=display_names,
    )
    return ui_query
