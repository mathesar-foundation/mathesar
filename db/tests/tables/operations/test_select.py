import sys
from sqlalchemy import text
from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations import select as ma_sel
import pytest
from db.metadata import get_empty_metadata

sys.stdout = sys.stderr

# Table names
ACADEMICS = 'academics'
ARTICLES = 'articles'
JOURNALS = 'journals'
PUBLISHERS = 'publishers'
UNIVERSITIES = 'universities'

# Column names
ID = 'id'
NAME = 'name'
INSTITUTION = 'institution'
ADVISOR = 'advisor'
TITLE = 'title'
PUBLISHER = 'publisher'
PRIMARY_AUTHOR = 'primary_author'
SECONDARY_AUTHOR = 'secondary_author'
JOURNAL = 'journal'

# joinable tables results columns
BASE = ma_sel.BASE
DEPTH = ma_sel.DEPTH
JP_PATH = ma_sel.JP_PATH
FK_PATH = ma_sel.FK_PATH
TARGET = ma_sel.TARGET
MULTIPLE_RESULTS = ma_sel.MULTIPLE_RESULTS


def _transform_row_to_names(row, engine):
    metadata = get_empty_metadata()
    output_dict = {
        BASE: ma_sel.reflect_table_from_oid(row[BASE], engine, metadata=metadata).name,
        TARGET: ma_sel.reflect_table_from_oid(row[TARGET], engine, metadata=metadata).name,
        JP_PATH: [
            [
                [
                    ma_sel.reflect_table_from_oid(oid, engine, metadata=metadata).name,
                    get_column_name_from_attnum(oid, attnum, engine, metadata=metadata)
                ]
                for oid, attnum in edge
            ]
            for edge in row[JP_PATH]
        ],
        FK_PATH: None,
        DEPTH: row[DEPTH],
        MULTIPLE_RESULTS: row[MULTIPLE_RESULTS]
    }
    return output_dict


L1_JOINABLE_TABLES_DICT = {
    ACADEMICS: [
        {
            BASE: ACADEMICS,
            TARGET: UNIVERSITIES,
            JP_PATH: [[[ACADEMICS, INSTITUTION], [UNIVERSITIES, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        }, {
            BASE: ACADEMICS,
            TARGET: ACADEMICS,
            JP_PATH: [[[ACADEMICS, ADVISOR], [ACADEMICS, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        }, {
            BASE: ACADEMICS,
            TARGET: ACADEMICS,
            JP_PATH: [[[ACADEMICS, ID], [ACADEMICS, ADVISOR]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        }, {
            BASE: ACADEMICS,
            TARGET: ARTICLES,
            JP_PATH: [[[ACADEMICS, ID], [ARTICLES, PRIMARY_AUTHOR]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        }, {
            BASE: ACADEMICS,
            TARGET: ARTICLES,
            JP_PATH: [[[ACADEMICS, ID], [ARTICLES, SECONDARY_AUTHOR]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        },
    ],
    ARTICLES: [
        {
            BASE: ARTICLES,
            TARGET: ACADEMICS,
            JP_PATH: [[[ARTICLES, PRIMARY_AUTHOR], [ACADEMICS, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        }, {
            BASE: ARTICLES,
            TARGET: ACADEMICS,
            JP_PATH: [[[ARTICLES, SECONDARY_AUTHOR], [ACADEMICS, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        }, {
            BASE: ARTICLES,
            TARGET: JOURNALS,
            JP_PATH: [[[ARTICLES, JOURNAL], [JOURNALS, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        },
    ],
    JOURNALS: [
        {
            BASE: JOURNALS,
            TARGET: UNIVERSITIES,
            JP_PATH: [[[JOURNALS, INSTITUTION], [UNIVERSITIES, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        }, {
            BASE: JOURNALS,
            TARGET: PUBLISHERS,
            JP_PATH: [[[JOURNALS, PUBLISHER], [PUBLISHERS, ID]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: False,
        }, {
            BASE: JOURNALS,
            TARGET: ARTICLES,
            JP_PATH: [[[JOURNALS, ID], [ARTICLES, JOURNAL]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        },
    ],
    PUBLISHERS: [
        {
            BASE: PUBLISHERS,
            TARGET: JOURNALS,
            JP_PATH: [[[PUBLISHERS, ID], [JOURNALS, PUBLISHER]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        }
    ],
    UNIVERSITIES: [
        {
            BASE: UNIVERSITIES,
            TARGET: ACADEMICS,
            JP_PATH: [[[UNIVERSITIES, ID], [ACADEMICS, INSTITUTION]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        }, {
            BASE: UNIVERSITIES,
            TARGET: JOURNALS,
            JP_PATH: [[[UNIVERSITIES, ID], [JOURNALS, INSTITUTION]]],
            FK_PATH: None,
            DEPTH: 1,
            MULTIPLE_RESULTS: True,
        },
    ],
}


def _get_expect_joinable_tables(base, depth):
    l1_paths = L1_JOINABLE_TABLES_DICT[base]
    if depth <= 1:
        return l1_paths
    else:
        return [
            {
                BASE: row[BASE],
                TARGET: target_row[TARGET],
                JP_PATH: row[JP_PATH] + target_row[JP_PATH],
                FK_PATH: None,
                DEPTH: row[DEPTH] + target_row[DEPTH],
                MULTIPLE_RESULTS: row[MULTIPLE_RESULTS] or target_row[MULTIPLE_RESULTS]
            }
            for row in l1_paths
            for target_row in _get_expect_joinable_tables(row[TARGET], depth - 1)
            if row[JP_PATH][-1] != target_row[JP_PATH][0][::-1]
        ]


JOINABLE_TABLES_PARAMS = [
    (base, depth) for base in L1_JOINABLE_TABLES_DICT for depth in [1, 2, 3]
]


# TODO Figure out how to test fkey paths

@pytest.mark.parametrize('table,depth', JOINABLE_TABLES_PARAMS)
def test_get_joinable_tables_query_paths(engine_with_academics, table, depth):
    engine, schema = engine_with_academics
    academics_oid = ma_sel.get_oid_from_table(table, schema, engine)
    joinable_tables = ma_sel.get_joinable_tables(
        engine, base_table_oid=academics_oid, max_depth=depth, metadata=get_empty_metadata()
    )
    all_row_lists = [
        _get_expect_joinable_tables(table, d) for d in range(1, depth + 1)
    ]
    expect_rows = sorted(
        [row for sublist in all_row_lists for row in sublist],
        key=lambda x: x[JP_PATH]
    )
    actual_rows = sorted(
        [_transform_row_to_names(row, engine) for row in joinable_tables],
        key=lambda x: x[JP_PATH]
    )
    assert expect_rows == actual_rows


def test_get_description_from_table(roster_table_name, engine_with_roster):
    engine, schema = engine_with_roster
    roster_table_oid = ma_sel.get_oid_from_table(roster_table_name, schema, engine)
    expect_comment = 'my super comment'
    with engine.begin() as conn:
        conn.execute(text(f'''COMMENT ON TABLE "{schema}"."{roster_table_name}" IS '{expect_comment}';'''))

    actual_comment = ma_sel.get_table_description(roster_table_oid, engine)

    assert actual_comment == expect_comment
