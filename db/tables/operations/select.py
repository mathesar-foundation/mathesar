import warnings

from sqlalchemy import (
    Table, MetaData, select, join, inspect, and_, cast, func, Integer, literal
)
from sqlalchemy.dialects.postgresql import JSONB

from db.utils import execute_statement

BASE = 'base'
DEPTH = 'depth'
PATH = 'path'
TARGET = 'target'


def reflect_table(name, schema, engine, metadata=None, connection_to_use=None):
    if metadata is None:
        metadata = MetaData(bind=engine)
    autoload_with = engine if connection_to_use is None else connection_to_use
    return Table(name, metadata, schema=schema, autoload_with=autoload_with, extend_existing=True)


def reflect_table_from_oid(oid, engine, connection_to_use=None):
    tables = reflect_tables_from_oids([oid], engine, connection_to_use)
    return tables.get(oid, None)


def reflect_tables_from_oids(oids, engine, connection_to_use=None):
    metadata = MetaData()

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_class = Table("pg_class", metadata, autoload_with=engine)
        pg_namespace = Table("pg_namespace", metadata, autoload_with=engine)
    sel = (
        select(pg_namespace.c.nspname, pg_class.c.relname, pg_class.c.oid)
        .select_from(
            join(
                pg_class,
                pg_namespace,
                pg_class.c.relnamespace == pg_namespace.c.oid
            )
        )
        .where(pg_class.c.oid.in_(oids))
    )
    results = execute_statement(engine, sel, connection_to_use).fetchall()
    tables = {}
    for (schema, table_name, table_oid) in results:
        tables[table_oid] = reflect_table(table_name, schema, engine, connection_to_use=connection_to_use)
    return tables


def get_table_oids_from_schema(schema_oid, engine):
    metadata = MetaData()

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_class = Table("pg_class", metadata, autoload_with=engine)
    sel = (
        select(pg_class.c.oid)
        .where(
            and_(pg_class.c.relkind == 'r', pg_class.c.relnamespace == schema_oid)
        )
    )
    with engine.begin() as conn:
        table_oids = conn.execute(sel).fetchall()
    return table_oids


def get_oid_from_table(name, schema, engine):
    inspector = inspect(engine)
    return inspector.get_table_oid(name, schema=schema)


def get_joinable_tables(base_table_oid, engine, max_depth=3):
    LEFT_REL = 'left_rel'
    RIGHT_REL = 'right_rel'
    LEFT_COL = 'left_col'
    RIGHT_COL = 'right_col'

    SYMMETRIC_FKEYS = 'symmetric_fkeys'
    SEARCH_FKEY_GRAPH = 'search_fkey_graph'
    OUTPUT_CTE = 'output_cte'

    jba = func.jsonb_build_array

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_constraint = Table("pg_constraint", MetaData(), autoload_with=engine)

    symmetric_fkeys = select(
        cast(pg_constraint.c.conrelid, Integer).label(LEFT_REL),
        cast(pg_constraint.c.confrelid, Integer).label(RIGHT_REL),
        cast(pg_constraint.c.conkey[1], Integer).label(LEFT_COL),
        cast(pg_constraint.c.confkey[1], Integer).label(RIGHT_COL),
    ).where(
        and_(
            pg_constraint.c.contype == 'f',
            func.array_length(pg_constraint.c.conkey, 1) == 1
        )
    ).union_all(
        select(
            cast(pg_constraint.c.confrelid, Integer).label(LEFT_REL),
            cast(pg_constraint.c.conrelid, Integer).label(RIGHT_REL),
            cast(pg_constraint.c.confkey[1], Integer).label(LEFT_COL),
            cast(pg_constraint.c.conkey[1], Integer).label(RIGHT_COL),
        ).where(
            and_(
                pg_constraint.c.contype == 'f',
                func.array_length(pg_constraint.c.conkey, 1) == 1
            )
        )
    ).cte(name=SYMMETRIC_FKEYS)

    search_fkey_graph = select(
        symmetric_fkeys.columns[LEFT_REL],
        symmetric_fkeys.columns[RIGHT_REL],
        symmetric_fkeys.columns[LEFT_COL],
        symmetric_fkeys.columns[RIGHT_COL],
        literal(1).label(DEPTH),
        cast(
            jba(
                jba(
                    jba(
                        symmetric_fkeys.columns[LEFT_REL],
                        symmetric_fkeys.columns[LEFT_COL]
                    ),
                    jba(
                        symmetric_fkeys.columns[RIGHT_REL],
                        symmetric_fkeys.columns[RIGHT_COL]
                    ),
                )
            ),
            JSONB
        ).label(PATH)
    ).cte(name=SEARCH_FKEY_GRAPH, recursive=True)

    search_fkey_graph = search_fkey_graph.union_all(
        select(
            symmetric_fkeys.columns[LEFT_REL],
            symmetric_fkeys.columns[RIGHT_REL],
            symmetric_fkeys.columns[LEFT_COL],
            symmetric_fkeys.columns[RIGHT_COL],
            search_fkey_graph.columns[DEPTH] + 1,
            search_fkey_graph.columns[PATH] + cast(
                jba(
                    jba(
                        jba(
                            symmetric_fkeys.columns[LEFT_REL],
                            symmetric_fkeys.columns[LEFT_COL]
                        ),
                        jba(
                            symmetric_fkeys.columns[RIGHT_REL],
                            symmetric_fkeys.columns[RIGHT_COL]
                        ),
                    )
                ),
                JSONB
            )
        ).where(
            and_(
                symmetric_fkeys.columns[LEFT_REL] == search_fkey_graph.columns[RIGHT_REL],
                search_fkey_graph.columns[DEPTH] < max_depth,
                search_fkey_graph.columns[PATH][-1] != jba(
                    jba(
                        symmetric_fkeys.columns[RIGHT_REL],
                        symmetric_fkeys.columns[RIGHT_COL]
                    ),
                    jba(
                        symmetric_fkeys.columns[LEFT_REL],
                        symmetric_fkeys.columns[LEFT_COL]
                    ),
                )
            )
        )
    )

    output_cte = select(
        cast(search_fkey_graph.columns[PATH][0][0][0], Integer).label(BASE),
        cast(search_fkey_graph.columns[PATH][-1][-1][0], Integer).label(TARGET),
        search_fkey_graph.columns[PATH].label(PATH),
        search_fkey_graph.columns[DEPTH].label(DEPTH)
    ).cte(name=OUTPUT_CTE)

    if base_table_oid is not None:
        final_sel = select(output_cte).where(
            output_cte.columns[BASE] == base_table_oid
        )
    else:
        final_sel = select(output_cte)

    with engine.begin() as conn:
        results = conn.execute(final_sel).fetchall()

    return results
