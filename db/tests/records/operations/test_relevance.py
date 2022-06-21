import json
from sqlalchemy import select, desc
from db.records.operations import relevance


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
            or
            ('John' in row['Student Name'] and row[relevance.SCORE_COL] == 2)
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

    with open('test_out2.txt', 'w') as f:
        f.writelines([json.dumps(r._asdict()) + '\n' for r in matches])

    assert len(matches) == 124 and all(
        [
            (
                row['Student Name'][:4] == 'John'
                and row['Subject'] == 'Math'
                and row[relevance.SCORE_COL] == 7
            )
            or
            (
                row['Student Name'][:4] == 'John'
                and row['Subject'] != 'Math'
                and row[relevance.SCORE_COL] == 3
            )
            or
            (
                'John' in row['Student Name']
                and row['Subject'] == 'Math'
                and row[relevance.SCORE_COL] == 6
            )
            or
            (
                'John' in row['Student Name']
                and row['Subject'] != 'Math'
                and row[relevance.SCORE_COL] == 2
            )
            or
            (
                'John' not in row['Student Name']
                and row['Subject'] == 'Math'
                and row[relevance.SCORE_COL] == 4
            )
            for row in matches
        ]
    )
