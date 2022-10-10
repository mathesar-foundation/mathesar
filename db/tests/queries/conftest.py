import pytest
from db.columns.operations.select import get_column_attnum_from_name as get_attnum
from db.tables.operations.select import get_oid_from_table
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata


@pytest.fixture
def shallow_link_dbquery(engine_with_academics):
    engine, schema = engine_with_academics
    acad_oid = get_oid_from_table('academics', schema, engine)
    uni_oid = get_oid_from_table('universities', schema, engine)
    metadata = get_empty_metadata()
    initial_columns = [
        InitialColumn(
            acad_oid,
            get_attnum(acad_oid, 'id', engine, metadata=metadata),
            alias='id',
        ),
        InitialColumn(
            uni_oid,
            get_attnum(uni_oid, 'name', engine, metadata=metadata),
            alias='institution_name',
            jp_path=[
                [
                    (acad_oid, get_attnum(acad_oid, 'institution', engine, metadata=metadata)),
                    (uni_oid, get_attnum(uni_oid, 'id', engine, metadata=metadata)),
                ],
            ],
        ),
    ]
    dbq = DBQuery(
        acad_oid,
        initial_columns,
        engine
    )
    return dbq
