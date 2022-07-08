from db.tables.operations import select as ma_sel
from mathesar.models.base import Table, Column, Constraint

TARGET = 'target'
FK_PATH = 'fk_path'
JP_PATH = 'jp_path'
DEPTH = 'depth'
MULTIPLE_RESULTS = 'multiple_results'


def get_processed_joinable_tables(table, limit=None, offset=None, max_depth=2):
    raw_joinable_tables = ma_sel.get_joinable_tables(
        table.schema._sa_engine,
        base_table_oid=table.oid,
        max_depth=max_depth,
        limit=limit,
        offset=offset
    )
    joinable_tables = [
        {
            TARGET: Table.objects.get(oid=row[ma_sel.TARGET]).id,
            JP_PATH: [
                [
                    Column.objects.get(table__oid=oid, attnum=attnum).id
                    for oid, attnum in edge
                ]
                for edge in row[ma_sel.JP_PATH]
            ],
            FK_PATH: [
                [Constraint.objects.get(oid=oid).id, reverse]
                for oid, reverse in row[ma_sel.FK_PATH]
            ],
            DEPTH: row[ma_sel.DEPTH],
            MULTIPLE_RESULTS: row[ma_sel.MULTIPLE_RESULTS],
        }
        for row in raw_joinable_tables
    ]
    return joinable_tables
