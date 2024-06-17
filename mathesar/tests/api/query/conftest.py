import pytest
from mathesar.models.query import Exploration


@pytest.fixture
def academics_ma_tables(db_table_to_dj_table, academics_db_tables):
    return {
        table_name: db_table_to_dj_table(db_table)
        for table_name, db_table
        in academics_db_tables.items()
    }


@pytest.fixture
def create_minimal_patents_query(create_patents_table, get_uid, patent_schema):
    schema_name = patent_schema.name

    def _create(schema_name=schema_name):
        base_table = create_patents_table(table_name=get_uid(), schema_name=schema_name)
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
        ui_query = Exploration.objects.create(
            base_table=base_table,
            initial_columns=initial_columns,
            display_options=display_options,
            display_names=display_names,
        )
        return ui_query

    return _create


@pytest.fixture
def minimal_patents_query(create_minimal_patents_query):
    query = create_minimal_patents_query()
    yield query

    # cleanup
    query.delete()
    query.base_table.delete()
