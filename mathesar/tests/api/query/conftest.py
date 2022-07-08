import pytest
from mathesar.models.query import UIQuery


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
    ui_query = UIQuery.objects.create(
        base_table=base_table,
        initial_columns=initial_columns,
    )
    return ui_query
