import warnings

from sqlalchemy import (
    Table, MetaData, select, join, inspect, and_, cast, func, Integer, literal, or_
)
from sqlalchemy.dialects.postgresql import JSONB

from db.utils import execute_statement

BASE = 'base'
DEPTH = 'depth'
JP_PATH = 'jp_path'
FK_PATH = 'fk_path'
REVERSE = 'reverse'
TARGET = 'target'
MULTIPLE_RESULTS = 'multiple_results'


def reflect_table(name, schema, engine, metadata=None, connection_to_use=None):
    if metadata is None:
        metadata = MetaData(bind=engine)
    autoload_with = engine if connection_to_use is None else connection_to_use
    return Table(name, metadata, schema=schema, autoload_with=autoload_with, extend_existing=True)


def reflect_table_from_oid(oid, engine, metadata=None, connection_to_use=None):
    tables = reflect_tables_from_oids([oid], engine, metadata=metadata, connection_to_use=connection_to_use)
    return tables.get(oid, None)


def reflect_tables_from_oids(oids, engine, metadata=None, connection_to_use=None):
    if metadata is None:
        metadata = MetaData(bind=engine)

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
        tables[table_oid] = reflect_table(table_name, schema, engine, metadata=metadata, connection_to_use=connection_to_use)
    return tables


def get_table_oids_from_schema(schema_oids, engine):
    metadata = MetaData()

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_class = Table("pg_class", metadata, autoload_with=engine)
    sel = (
        select(pg_class.c.oid, pg_class.c.relnamespace.label('schema_oid'))
        .where(
            and_(pg_class.c.relkind == 'r', pg_class.c.relnamespace.in_(schema_oids))
        )
    )
    with engine.begin() as conn:
        table_oids = conn.execute(sel).fetchall()
    return table_oids


def get_oid_from_table(name, schema, engine):
    inspector = inspect(engine)
    return inspector.get_table_oid(name, schema=schema)


def get_table_description(oid, engine):
    with engine.begin() as conn:
        res = conn.execute(select(func.obj_description(oid, 'pg_class')))
    return res.fetchone()[0]


def get_joinable_tables(
        engine, base_table_oid=None, max_depth=3, limit=None, offset=None
):
    FK_OID = 'fk_oid'
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
        cast(pg_constraint.c.oid, Integer).label(FK_OID),
        cast(pg_constraint.c.conrelid, Integer).label(LEFT_REL),
        cast(pg_constraint.c.confrelid, Integer).label(RIGHT_REL),
        cast(pg_constraint.c.conkey[1], Integer).label(LEFT_COL),
        cast(pg_constraint.c.confkey[1], Integer).label(RIGHT_COL),
        literal(False).label(MULTIPLE_RESULTS),
        literal(False).label(REVERSE),
    ).where(
        and_(
            pg_constraint.c.contype == 'f',
            func.array_length(pg_constraint.c.conkey, 1) == 1
        )
    ).union_all(
        select(
            cast(pg_constraint.c.oid, Integer).label(FK_OID),
            cast(pg_constraint.c.confrelid, Integer).label(LEFT_REL),
            cast(pg_constraint.c.conrelid, Integer).label(RIGHT_REL),
            cast(pg_constraint.c.confkey[1], Integer).label(LEFT_COL),
            cast(pg_constraint.c.conkey[1], Integer).label(RIGHT_COL),
            literal(True).label(MULTIPLE_RESULTS),
            literal(True).label(REVERSE),
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
        ).label(JP_PATH),
        cast(
            jba(
                jba(
                    symmetric_fkeys.columns[FK_OID],
                    symmetric_fkeys.columns[REVERSE],
                )
            ),
            JSONB
        ).label(FK_PATH),
        symmetric_fkeys.columns[MULTIPLE_RESULTS],
    ).cte(name=SEARCH_FKEY_GRAPH, recursive=True)

    search_fkey_graph = search_fkey_graph.union_all(
        select(
            symmetric_fkeys.columns[LEFT_REL],
            symmetric_fkeys.columns[RIGHT_REL],
            symmetric_fkeys.columns[LEFT_COL],
            symmetric_fkeys.columns[RIGHT_COL],
            search_fkey_graph.columns[DEPTH] + 1,
            search_fkey_graph.columns[JP_PATH] + cast(
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
            ),
            search_fkey_graph.columns[FK_PATH] + cast(
                jba(
                    jba(
                        symmetric_fkeys.columns[FK_OID],
                        symmetric_fkeys.columns[REVERSE],
                    )
                ),
                JSONB
            ),
            or_(
                search_fkey_graph.columns[MULTIPLE_RESULTS],
                symmetric_fkeys.columns[MULTIPLE_RESULTS]
            )
        ).where(
            and_(
                symmetric_fkeys.columns[LEFT_REL] == search_fkey_graph.columns[RIGHT_REL],
                search_fkey_graph.columns[DEPTH] < max_depth,
                search_fkey_graph.columns[JP_PATH][-1] != jba(
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
        cast(search_fkey_graph.columns[JP_PATH][0][0][0], Integer).label(BASE),
        cast(search_fkey_graph.columns[JP_PATH][-1][-1][0], Integer).label(TARGET),
        search_fkey_graph.columns[JP_PATH].label(JP_PATH),
        search_fkey_graph.columns[FK_PATH].label(FK_PATH),
        search_fkey_graph.columns[DEPTH].label(DEPTH),
        search_fkey_graph.columns[MULTIPLE_RESULTS].label(MULTIPLE_RESULTS)
    ).cte(name=OUTPUT_CTE)

    if base_table_oid is not None:
        final_sel = select(output_cte).where(
            output_cte.columns[BASE] == base_table_oid
        )
    else:
        final_sel = select(output_cte)

    with engine.begin() as conn:
        results = conn.execute(final_sel.limit(limit).offset(offset)).fetchall()

    return results
