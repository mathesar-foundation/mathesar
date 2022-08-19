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
            'display_name': 'Column 1',
        },
        {
            'id': col2_dj.id,
            'alias': 'col2',
            'display_name': 'Column 2',
        },
    ]
    oid = base_table_dj.oid
    attnum1 = col1_dj.attnum
    attnum2 = col2_dj.attnum
    initial_columns = [
        InitialColumn(
            oid,
            attnum1,
            alias='col1',
            jp_path=None,
        ),
        InitialColumn(
            oid,
            attnum2,
            alias='col2',
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
    wanted_db_query = DBQuery(
        base_table_oid=oid,
        initial_columns=initial_columns,
        engine=ui_query._sa_engine,
        transformations=transformations,
        name=name,
    )
    actual_db_query = ui_query.db_query
    assert actual_db_query.name == wanted_db_query.name
    assert actual_db_query.base_table_oid == wanted_db_query.base_table_oid
    for actual, wanted in zip(
        actual_db_query.initial_columns,
        wanted_db_query.initial_columns
    ):
        assert actual.alias == wanted.alias
        assert actual.jp_path == wanted.jp_path
        assert actual.reloid == wanted.reloid
        assert actual.attnum == wanted.attnum
    for actual, wanted in zip(
        actual_db_query.transformations,
        wanted_db_query.transformations
    ):
        assert actual == wanted
