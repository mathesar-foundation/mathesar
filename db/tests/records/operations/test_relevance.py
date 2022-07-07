from sqlalchemy import select, desc
from db.records.operations import relevance


def test_rank_and_filter_rows(roster_table_obj):
    roster, engine = roster_table_obj
    sel = relevance.get_rank_and_filter_rows_query(
        roster, {'Student Name': 'John'}, engine
    )

    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()

    assert len(res) == 10 and all(
        ['John' in row['Student Name'] for row in res]
    )


def test_get_scored_selectable_text_exact(roster_table_obj):
    roster, engine = roster_table_obj
    sel = select(
        relevance._get_scored_selectable(
            roster, {'Student Name': 'John Jones'}, engine
        )
    ).order_by(desc(relevance.SCORE_COL))
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()

    matches = [
        row for row in res if row[relevance.SCORE_COL] > 0
    ]

    assert len(matches) == 5 and all(
        [
            row['Student Name'] == 'John Jones'
            and row[relevance.SCORE_COL] == 4
            for row in matches
        ]
    )


def test_get_scored_selectable_text_begin_and_mid(roster_table_obj):
    roster, engine = roster_table_obj
    sel = select(
        relevance._get_scored_selectable(
            roster, {'Student Name': 'John'}, engine
        )
    ).order_by(desc(relevance.SCORE_COL))
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()

    matches = [
        row for row in res if row[relevance.SCORE_COL] > 0
    ]

    assert len(matches) == 40 and all(
        [
            (row['Student Name'][:4] == 'John' and row[relevance.SCORE_COL] == 3)
            or ('John' in row['Student Name'] and row[relevance.SCORE_COL] == 2)
            for row in matches
        ]
    )


def test_get_scored_selectable_multicol(roster_table_obj):
    roster, engine = roster_table_obj
    sel = select(
        relevance._get_scored_selectable(
            roster, {'Student Name': 'John', 'Subject': 'Math'}, engine
        )
    ).order_by(desc(relevance.SCORE_COL), 'Student Number')
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()

    matches = [
        row for row in res if row[relevance.SCORE_COL] > 0
    ]

    assert len(matches) == 124 and all(
        [
            (
                row['Student Name'][:4] == 'John'
                and row['Subject'] == 'Math'
                and row[relevance.SCORE_COL] == 7
            ) or (
                row['Student Name'][:4] == 'John'
                and row['Subject'] != 'Math'
                and row[relevance.SCORE_COL] == 3
            ) or (
                'John' in row['Student Name']
                and row['Subject'] == 'Math'
                and row[relevance.SCORE_COL] == 6
            ) or (
                'John' in row['Student Name']
                and row['Subject'] != 'Math'
                and row[relevance.SCORE_COL] == 2
            ) or (
                'John' not in row['Student Name']
                and row['Subject'] == 'Math'
                and row[relevance.SCORE_COL] == 4
            )
            for row in matches
        ]
    )


def test_get_scored_selectable_nontext(roster_table_obj):
    roster, engine = roster_table_obj
    sel = select(
        relevance._get_scored_selectable(roster, {'Grade': 100}, engine)
    ).order_by(desc(relevance.SCORE_COL))
    with engine.begin() as conn:
        res = conn.execute(sel).fetchall()

    matches = [
        row for row in res if row[relevance.SCORE_COL] > 0
    ]

    assert len(matches) == 7 and all(
        [row['Grade'] == 100 and row[relevance.SCORE_COL] == 4 for row in matches]
    )
