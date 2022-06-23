from sqlalchemy import MetaData, Table, any_, case, column, exists, func, select, true
from db.tables.operations.select import get_oid_from_table


def has_dependencies(name, schema, engine):
    oid = get_oid_from_table(name, schema, engine)
    
    metadata = MetaData()
    pg_depend = Table("pg_depend", metadata, autoload_with=engine)

    stmt = select(
        exists(
            select().select_from(pg_depend) \
    .where(pg_depend.c.refobjid == oid) \
    .where(pg_depend.c.deptype == any_('{a,n}')) \
    .where(pg_depend.c.objid >= 16384) \
    .group_by(
        pg_depend.c.objid,
        pg_depend.c.deptype)
        )) \

    with engine.connect() as conn:
        result = conn.execute(stmt)

    return result


def get_dependent_objects(name, schema, engine):
    oid = get_oid_from_table(name, schema, engine)
    
    metadata = MetaData()
    pg_depend = Table("pg_depend", metadata, autoload_with=engine)

    pg_identify_object = select(
            column("name"),
            column("type"),
            column("identity")) \
        .select_from(func.pg_identify_object(
            pg_depend.c.classid,
            pg_depend.c.objid,
            pg_depend.c.objsubid)) \
        .lateral()

    dependency_case = case(
                    (pg_depend.c.deptype == 'n', 'normal'),
                    (pg_depend.c.deptype == 'a', 'automatic')
                ).label('dependency_type')

    stmt = select(
        pg_depend.c.objid,
        func.array_agg(pg_depend.c.objsubid),
        pg_identify_object.c.name,
        pg_identify_object.c.type,
        pg_identify_object.c.identity,
        dependency_case) \
    .select_from(pg_depend) \
    .join(pg_identify_object, true()) \
    .where(pg_depend.c.refobjid == oid) \
    .where(pg_depend.c.deptype == any_('{a,n}')) \
    .where(pg_depend.c.objid >= 16384) \
    .group_by(
        pg_depend.c.objid,
        pg_identify_object.c.type,
        pg_identify_object.c.name,
        pg_identify_object.c.identity,
        pg_depend.c.deptype)

    with engine.connect() as conn:
        result = conn.execute(stmt)

    return result