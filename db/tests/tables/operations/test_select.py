import sys
from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations import select as ma_sel
import pytest

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
PATH = ma_sel.PATH
TARGET = ma_sel.TARGET


def _transform_row_to_names(row, engine):
    output_dict = {
        ma_sel.BASE: ma_sel.reflect_table_from_oid(row[ma_sel.BASE], engine).name,
        ma_sel.TARGET: ma_sel.reflect_table_from_oid(row[ma_sel.TARGET], engine).name,
        ma_sel.PATH: [
            [
                [
                    ma_sel.reflect_table_from_oid(oid, engine).name,
                    get_column_name_from_attnum(oid, attnum, engine)
                ]
                for oid, attnum in edge
            ]
            for edge in row[ma_sel.PATH]
        ],
        ma_sel.DEPTH: row[ma_sel.DEPTH]
    }
    return output_dict


L1_JOINABLE_TABLES_DICT = {
    ACADEMICS: [
        {
            BASE: ACADEMICS,
            TARGET: UNIVERSITIES,
            PATH: [[[ACADEMICS, INSTITUTION], [UNIVERSITIES, ID]]],
            DEPTH: 1
        }, {
            BASE: ACADEMICS,
            TARGET: ACADEMICS,
            PATH: [[[ACADEMICS, ADVISOR], [ACADEMICS, ID]]],
            DEPTH: 1
        }, {
            BASE: ACADEMICS,
            TARGET: ACADEMICS,
            PATH: [[[ACADEMICS, ID], [ACADEMICS, ADVISOR]]],
            DEPTH: 1
        }, {
            BASE: ACADEMICS,
            TARGET: ARTICLES,
            PATH: [[[ACADEMICS, ID], [ARTICLES, PRIMARY_AUTHOR]]],
            DEPTH: 1
        }, {
            BASE: ACADEMICS,
            TARGET: ARTICLES,
            PATH: [[[ACADEMICS, ID], [ARTICLES, SECONDARY_AUTHOR]]],
            DEPTH: 1
        },
    ],
    ARTICLES: [
        {
            BASE: ARTICLES,
            TARGET: ACADEMICS,
            PATH: [[[ARTICLES, PRIMARY_AUTHOR], [ACADEMICS, ID]]],
            DEPTH: 1
        }, {
            BASE: ARTICLES,
            TARGET: ACADEMICS,
            PATH: [[[ARTICLES, SECONDARY_AUTHOR], [ACADEMICS, ID]]],
            DEPTH: 1
        }, {
            BASE: ARTICLES,
            TARGET: JOURNALS,
            PATH: [[[ARTICLES, JOURNAL], [JOURNALS, ID]]],
            DEPTH: 1
        },
    ],
    JOURNALS: [
        {
            BASE: JOURNALS,
            TARGET: UNIVERSITIES,
            PATH: [[[JOURNALS, INSTITUTION], [UNIVERSITIES, ID]]],
            DEPTH: 1
        }, {
            BASE: JOURNALS,
            TARGET: PUBLISHERS,
            PATH: [[[JOURNALS, PUBLISHER], [PUBLISHERS, ID]]],
            DEPTH: 1
        }, {
            BASE: JOURNALS,
            TARGET: ARTICLES,
            PATH: [[[JOURNALS, ID], [ARTICLES, JOURNAL]]],
            DEPTH: 1
        },
    ],
    PUBLISHERS: [
        {
            BASE: PUBLISHERS,
            TARGET: JOURNALS,
            PATH: [[[PUBLISHERS, ID], [JOURNALS, PUBLISHER]]],
            DEPTH: 1
        }
    ],
    UNIVERSITIES: [
        {
            BASE: UNIVERSITIES,
            TARGET: ACADEMICS,
            PATH: [[[UNIVERSITIES, ID], [ACADEMICS, INSTITUTION]]],
            DEPTH: 1
        }, {
            BASE: UNIVERSITIES,
            TARGET: JOURNALS,
            PATH: [[[UNIVERSITIES, ID], [JOURNALS, INSTITUTION]]],
            DEPTH: 1
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
                PATH: row[PATH] + target_row[PATH],
                DEPTH: row[DEPTH] + target_row[DEPTH]
            }
            for row in l1_paths
            for target_row in _get_expect_joinable_tables(row[TARGET], depth - 1)
            if row[PATH][-1] != target_row[PATH][0][::-1]
        ]


JOINABLE_TABLES_PARAMS = [
    (base, depth) for base in L1_JOINABLE_TABLES_DICT for depth in [1, 2, 3]
]


@pytest.mark.parametrize('table,depth', JOINABLE_TABLES_PARAMS)
def test_get_joinable_tables_query_paths(
        engine_with_academics, table, depth
):
    engine, schema = engine_with_academics
    academics_oid = ma_sel.get_oid_from_table(table, schema, engine)
    joinable_tables = ma_sel.get_joinable_tables(academics_oid, engine, max_depth=depth)
    all_row_lists = [
        _get_expect_joinable_tables(table, d) for d in range(1, depth + 1)
    ]
    expect_rows = sorted(
        [row for sublist in all_row_lists for row in sublist],
        key=lambda x: x[PATH]
    )
    actual_rows = sorted(
        [_transform_row_to_names(row, engine) for row in joinable_tables],
        key=lambda x: x[PATH]
    )
    assert expect_rows == actual_rows
