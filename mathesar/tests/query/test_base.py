from mathesar.models.query import UIQuery
from db.queries.base import DBQuery, InitialColumn
from db.transforms import base as transforms_base


def test_convert_to_db_query(create_patents_table, get_uid):
    base_table_dj = create_patents_table(table_name=get_uid())
    col1_dj = base_table_dj.get_column_by_name('Center')
    col2_dj = base_table_dj.get_column_by_name('Case Number')
    initial_columns_json = [
        {
            'id': col1_dj.id,
            'alias': 'col1',
            'name': 'Column 1',
        },
        {
            'id': col2_dj.id,
            'alias': 'col2',
            'name': 'Column 2',
        },
    ]
    initial_columns = [
        InitialColumn(
            alias='col1',
            column=col1_dj._sa_column.to_sa_column(),
            jp_path=None,
        ),
        InitialColumn(
            alias='col2',
            column=col2_dj._sa_column.to_sa_column(),
            jp_path=None,
        ),
    ]
    transformations_json = [
        dict(
            type="limit",
            spec=5,
        ),
        dict(
            type="offset",
            spec=15,
        ),
    ]
    transformations = [
        transforms_base.Limit(5),
        transforms_base.Offset(15),
    ]
    name = "some query"
    ui_query = UIQuery(
        name=name,
        base_table=base_table_dj,
        initial_columns=initial_columns_json,
        transformations=transformations_json,
    )
    base_table_sa = base_table_dj._sa_table
    wanted_db_query = DBQuery(
        name=name,
        base_table=base_table_sa,
        initial_columns=initial_columns,
        transformations=transformations,
    )
    actual_db_query = ui_query.db_query
    assert actual_db_query.name == wanted_db_query.name
    assert actual_db_query.base_table == wanted_db_query.base_table
    for actual, wanted in zip(
        actual_db_query.initial_columns,
        wanted_db_query.initial_columns
    ):
        assert actual.alias == wanted.alias
        assert actual.jp_path == wanted.jp_path
        _assert_sa_cols_equal(actual.column, wanted.column)
    for actual, wanted in zip(
        actual_db_query.transformations,
        wanted_db_query.transformations
    ):
        assert actual == wanted


def _assert_sa_cols_equal(a, b):
    assert a.name == b.name
    assert a.table.schema == b.table.schema
    assert a.table.name == b.table.name
