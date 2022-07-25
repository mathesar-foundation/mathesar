from sqlalchemy import MetaData, Table, any_, case, column, exists, func, literal, literal_column, select, text, true, union
from db.tables.operations.select import get_oid_from_table
from sqlalchemy.dialects.postgresql import array


# CTEs for getting dependents of a specific type

def _get_table_dependents(foreign_key_dependents, pg_constraint):
    pg_identify_object = select(
        column("name"),
        column("schema"),
        column("type"),
        column("identity")) \
        .select_from(func.pg_identify_object(
            text('\'pg_class\'::regclass::oid'),
            pg_constraint.c.conrelid,
            0)) \
        .lateral()

    return select(
        pg_constraint.c.conrelid.label('objid'),
        foreign_key_dependents.c.refobjid,
        foreign_key_dependents.c.column_number,
        pg_identify_object.c.name,
        pg_identify_object.c.schema,
        pg_identify_object.c.type,
        pg_identify_object.c.identity,
        foreign_key_dependents.c.dependency_type) \
        .select_from(foreign_key_dependents) \
        .join(pg_constraint, pg_constraint.c.oid == foreign_key_dependents.c.objid) \
        .join(pg_identify_object, true()) \
        .where(pg_constraint.c.confrelid != 0) \
        .group_by(
            pg_constraint.c.conrelid,
            foreign_key_dependents.c.refobjid,
            foreign_key_dependents.c.column_number,
            pg_identify_object.c.type,
            pg_identify_object.c.name,
            pg_identify_object.c.schema,
            pg_identify_object.c.identity,
            foreign_key_dependents.c.dependency_type)


def _get_foreign_key_constraint_dependents(pg_identify_object, base):
    return base.where(pg_identify_object.c.type == 'table constraint')

# Full statements


def get_all_dependent_objects(name, schema, engine):
    referenced_object_id = get_oid_from_table(name, schema, engine)
    pg_depend = _get_pg_depend(engine)
    pg_identify_object = _get_pg_identify_object_lateral(pg_depend)
    final = _get_all_dependent_objects_base_statement(pg_depend, pg_identify_object, referenced_object_id).cte()
    stmt = select(final)

    with engine.connect() as conn:
        result = conn.execute(stmt)

    return result


def get_dependents_hierarchy(name, schema, engine):
    referenced_object_id = get_oid_from_table(name, schema, engine)
    all = _get_all_dependent_objects_statement_v2(name, schema, engine)
    all_cte = all.cte(recursive=True, name='all')

    topq = select(
        all_cte,
        literal(1).label('level'),
        array([all_cte.c.refobjid]).label('chain')).where(all_cte.c.refobjid == referenced_object_id).where(all_cte.c.objid != referenced_object_id)
    topq = topq.cte('cte')

    bottomq = select(
        all_cte,
        literal_column('cte.level + 1').label('level'),
        topq.c.chain + array([all_cte.c.objid])) \
        .where(topq.c.level < 10) \
        .where(all_cte.c.objid != any_(topq.c.chain)) \
        .where(all_cte.c.objid != all_cte.c.refobjid)
    bottomq = bottomq.join(topq, all_cte.c.refobjid == topq.c.objid)

    recursive_q = topq.union(bottomq)
    q = select(recursive_q)

    with engine.connect() as conn:
        result = conn.execute(q)

    return result


def _get_dependent_objects_by_id_base_statement(pg_depend, pg_identify_object, referenced_object_id):
    return select(
        pg_depend.c.objid,
        func.array_agg(pg_depend.c.objsubid).label('column_number'),
        pg_identify_object.c.name,
        pg_identify_object.c.schema,
        pg_identify_object.c.type,
        pg_identify_object.c.identity,
        _get_dependency_case(pg_depend).label('dependency_type')) \
        .select_from(pg_depend) \
        .join(pg_identify_object, true()) \
        .where(pg_depend.c.refobjid == referenced_object_id) \
        .where(pg_depend.c.deptype == any_('{a,n}')) \
        .where(pg_depend.c.objid >= 16384) \
        .group_by(
            pg_depend.c.objid,
            pg_identify_object.c.type,
            pg_identify_object.c.name,
            pg_identify_object.c.schema,
            pg_identify_object.c.identity,
            pg_depend.c.deptype)


def _get_all_dependent_objects_base_statement(pg_depend, pg_identify_object, referenced_object_id=None):
    res = select(
        pg_depend.c.objid,
        pg_depend.c.refobjid,
        func.array_agg(pg_depend.c.objsubid).label('column_number'),
        pg_identify_object.c.name,
        pg_identify_object.c.schema,
        pg_identify_object.c.type,
        pg_identify_object.c.identity,
        _get_dependency_case(pg_depend).label('dependency_type')) \
        .select_from(pg_depend) \
        .join(pg_identify_object, true()) \
        .where(pg_depend.c.deptype == any_('{a,n}')) \
        .where(pg_depend.c.objid >= 16384) \
        .group_by(
            pg_depend.c.objid,
            pg_depend.c.refobjid,
            pg_identify_object.c.type,
            pg_identify_object.c.name,
            pg_identify_object.c.schema,
            pg_identify_object.c.identity,
            pg_depend.c.deptype)

    return res if referenced_object_id is None else res.where(pg_depend.c.refobjid == referenced_object_id)


# Getting helpers

def _get_pg_depend(engine):
    metadata = MetaData()
    return Table("pg_depend", metadata, autoload_with=engine)


def _get_pg_constraint(engine):
    metadata = MetaData()
    return Table("pg_constraint", metadata, autoload_with=engine)


def _get_pg_identify_object_lateral(source):
    return select(
        column("name"),
        column("schema"),
        column("type"),
        column("identity")) \
        .select_from(func.pg_identify_object(
            source.c.classid,
            source.c.objid,
            source.c.objsubid)) \
        .lateral()


def _get_dependency_case(pg_depend):
    return case(
        (pg_depend.c.deptype == 'n', 'normal'),
        (pg_depend.c.deptype == 'a', 'automatic')
    ).label('dependency_type')


# Callers

def _get_all_dependent_objects_statement_v2(name, schema, engine):
    pg_depend = _get_pg_depend(engine)
    pg_identify_object = _get_pg_identify_object_lateral(pg_depend)
    pg_constraint = _get_pg_constraint(engine)

    base_stmt = _get_all_dependent_objects_base_statement(pg_depend, pg_identify_object)
    foreign_key_constraint_dependents = _get_foreign_key_constraint_dependents(pg_identify_object, base_stmt).cte('foreign_key_constraint_dependents')
    table_dependents = _get_table_dependents(foreign_key_constraint_dependents, pg_constraint).cte('table_dependents')

    return union(select(foreign_key_constraint_dependents), select(table_dependents))


def has_dependencies(name, schema, engine):
    oid = get_oid_from_table(name, schema, engine)
    pg_depend = _get_pg_depend(engine)

    stmt = select(
        exists(
            select().select_from(pg_depend)
            .where(pg_depend.c.refobjid == oid)
            .where(pg_depend.c.deptype == any_('{a,n}'))
            .where(pg_depend.c.objid >= 16384)
        )
    )

    with engine.connect() as conn:
        result = conn.execute(stmt)

    return result is not None
