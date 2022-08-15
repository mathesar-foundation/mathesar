import pytest
from db.queries.base import DBQuery, InitialColumn, JoinParams


@pytest.fixture
def shallow_link_dbquery(academics_db_tables):
    acad_table = academics_db_tables['academics']
    uni_table = academics_db_tables['universities']
    initial_columns = [
        InitialColumn(
            alias='id',
            column=acad_table.c.id,
        ),
        InitialColumn(
            alias='institution_name',
            column=uni_table.c.name,
            jp_path=[
                JoinParams(
                    left_column=acad_table.c.institution,
                    right_column=uni_table.c.id,
                ),
            ],
        ),
    ]
    dbq = DBQuery(
        base_table=acad_table,
        initial_columns=initial_columns,
    )
    return dbq
