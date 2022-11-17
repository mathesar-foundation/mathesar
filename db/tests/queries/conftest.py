import pytest
from db.columns.operations.select import get_column_attnum_from_name as get_attnum
from db.tables.operations.select import get_oid_from_table
from db.queries.base import DBQuery, InitialColumn
from db.metadata import get_empty_metadata


@pytest.fixture
def shallow_link_dbquery(engine_with_academics):
    engine, schema = engine_with_academics
    metadata = get_empty_metadata()
    acad_oid = get_oid_from_table('academics', schema, engine)
    acad_id_attnum = get_attnum(acad_oid, 'id', engine, metadata=metadata)
    acad_insitution_attnum = get_attnum(acad_oid, 'institution', engine, metadata=metadata)
    uni_oid = get_oid_from_table('universities', schema, engine)
    uni_name_attnum = get_attnum(uni_oid, 'name', engine, metadata=metadata)
    uni_id_attnum = get_attnum(uni_oid, 'id', engine, metadata=metadata)
    initial_columns = [
        InitialColumn(
            acad_oid,
            acad_id_attnum,
            alias='id',
        ),
        InitialColumn(
            uni_oid,
            uni_name_attnum,
            alias='institution_name',
            jp_path=[
                [
                    (acad_oid, acad_insitution_attnum),
                    (uni_oid, uni_id_attnum),
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
