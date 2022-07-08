import pytest
from mathesar.models.query import UIQuery


@pytest.fixture
def minimal_patents_query(create_patents_table, get_uid):
    base_table = create_patents_table(table_name=get_uid())
    initial_columns = [
        {
            'id': base_table.get_column_by_name('Center').id,
            'alias': 'col1',
            'name': 'Column 1',
        },
        {
            'id': base_table.get_column_by_name('Case Number').id,
            'alias': 'col2',
            'name': 'Column 2',
        },
    ]
    display_options = {
        'col1': dict(a=1),
        'col2': dict(b=2),
    }
    ui_query = UIQuery.objects.create(
        base_table=base_table,
        initial_columns=initial_columns,
        display_options=display_options,
    )
    return ui_query
