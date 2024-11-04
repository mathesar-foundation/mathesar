import pytest
from sqlalchemy import inspect
from db.deprecated.columns import get_column_attnum_from_name as get_attnum
from db.deprecated.queries.base import DBQuery, InitialColumn, JoinParameter
from db.deprecated.metadata import get_empty_metadata


@pytest.fixture
def shallow_link_dbquery(engine_with_academics):
    engine, schema = engine_with_academics
    metadata = get_empty_metadata()
    acad_oid = inspect(engine).get_table_oid('academics', schema=schema)
    acad_id_attnum = get_attnum(acad_oid, 'id', engine, metadata=metadata)
    acad_institution_attnum = get_attnum(acad_oid, 'institution', engine, metadata=metadata)
    uni_oid = inspect(engine).get_table_oid('universities', schema=schema)
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
                JoinParameter(
                    acad_oid, acad_institution_attnum,
                    uni_oid, uni_id_attnum,
                ),
            ],
        ),
    ]
    dbq = DBQuery(
        acad_oid,
        initial_columns,
        engine
    )
    return dbq
