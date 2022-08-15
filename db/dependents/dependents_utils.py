from sqlalchemy import MetaData, Table, any_, case, column, exists, func, literal, select, text, true, union
from sqlalchemy.dialects.postgresql import array

# OIDs assigned during normal database operation are constrained to be 16384 or higher.
USER_DEFINED_OBJECTS_MIN_OID = 16384


def get_dependents_graph(referenced_object_id, engine):
    all_dependent_objects_statement = _get_all_dependent_objects_statement(engine)
    all_cte = all_dependent_objects_statement.cte(recursive=True, name='all')

    # anchor member which includes all dependents of a requested object
    topq = select(
        all_cte,
        literal(1).label('level'),
        array([all_cte.c.refobjid]).label('chain')).where(all_cte.c.refobjid == referenced_object_id).where(all_cte.c.objid != referenced_object_id)
    topq = topq.cte('cte')

    # recursive member which includes dependents for each object of the previous level
    bottomq = select(
        all_cte,
        (topq.c.level + 1).label('level'),
        topq.c.chain + array([all_cte.c.objid])) \
        .where(topq.c.level < 10) \
        .where(all_cte.c.objid != any_(topq.c.chain)) \
        .where(all_cte.c.objid != all_cte.c.refobjid)
    bottomq = bottomq.join(topq, all_cte.c.refobjid == topq.c.objid)

    recursive_q = topq.union(bottomq)
    q = select(recursive_q)

    with engine.connect() as conn:
        result = conn.execute(q)

    # initial way of structuring the final response
    # TODO: extract in a separate function
    final = []
    for r in result:
        d = {}
        d['level'] = r.level
        d['obj'] = {'objid': r.objid, 'type': r.type}
        d['parent_obj'] = {'objid': r.refobjid}
        final.append(d)

    return final


# finding table dependents based on foreign key constraints from the referenced tables
def _get_table_dependents_from_fk(foreign_key_dependents, pg_constraint):
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

    # conrelid in this case is the oid of the table which a constraint resides in
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


def _get_table_dependents(pg_identify_object, base):
    return base.where(pg_identify_object.c.type == 'table')


# getting a full list of dependents and identifying them
def _get_all_dependent_objects_base_statement(pg_depend, pg_identify_object):
    result = select(
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

    return result


def _get_pg_depend(engine, metadata):
    return Table("pg_depend", metadata, autoload_with=engine)


def _get_pg_constraint(engine, metadata):
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


def _get_all_dependent_objects_statement(engine):
    metadata = MetaData()
    pg_depend = _get_pg_depend(engine, metadata)
    pg_identify_object = _get_pg_identify_object_lateral(pg_depend)
    pg_constraint = _get_pg_constraint(engine, metadata)

    # each statement filters the base statement extracting dependents of a specific type
    # so it's easy to exclude particular types or add new
    base_stmt = _get_all_dependent_objects_base_statement(pg_depend, pg_identify_object)
    foreign_key_constraint_dependents = _get_foreign_key_constraint_dependents(pg_identify_object, base_stmt).cte('foreign_key_constraint_dependents')
    table_from_fk_dependents = _get_table_dependents_from_fk(foreign_key_constraint_dependents, pg_constraint).cte('table_from_fk_dependents')
    table_dependents = _get_table_dependents(pg_identify_object, base_stmt).cte('table_dependents')

    return union(
        select(foreign_key_constraint_dependents),
        select(table_from_fk_dependents),
        select(table_dependents))


def has_dependencies(referenced_object_id, engine):
    metadata = MetaData()
    pg_depend = _get_pg_depend(engine, metadata)

    stmt = select(
        exists(
            select().select_from(pg_depend)
            .where(pg_depend.c.refobjid == referenced_object_id)
            .where(pg_depend.c.deptype == any_('{a,n}'))
            .where(pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID)
        )
    )

    with engine.connect() as conn:
        result = conn.execute(stmt)

    return result is not None
