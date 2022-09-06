from sqlalchemy import MetaData, Table, any_, column, exists, func, literal, select, text, true, union
from sqlalchemy.dialects.postgresql import array

# OIDs assigned during normal database operation are constrained to be 16384 or higher.
USER_DEFINED_OBJECTS_MIN_OID = 16384
# automatic and normal dependents
PG_DEPENDENT_TYPES = ['a', 'n']
PG_CLASS_CATALOGUE_NAME = '\'pg_class\''
START_LEVEL = 1
MAX_LEVEL = 10


def get_dependents_graph(referenced_object_id, engine):
    dependency_pairs = _get_typed_dependency_pairs_stmt(engine)
    dependency_pairs_cte = dependency_pairs.cte(recursive=True, name='dependency_pairs_cte')

    # anchor member which includes all dependents of a requested object
    anchor = select(
        dependency_pairs_cte,
        literal(START_LEVEL).label('level'),
        array([dependency_pairs_cte.c.refobjid]).label('dependency_chain')) \
        .where(dependency_pairs_cte.c.refobjid == referenced_object_id) \
        .where(dependency_pairs_cte.c.objid != referenced_object_id)
    anchor = anchor.cte('cte')

    # recursive member which includes dependents for each object of the previous level
    recursive = select(
        dependency_pairs_cte,
        (anchor.c.level + 1),
        anchor.c.dependency_chain + array([anchor.c.objid])) \
        .where(anchor.c.level < MAX_LEVEL) \
        .where(dependency_pairs_cte.c.objid != any_(anchor.c.dependency_chain)) \
        .where(dependency_pairs_cte.c.objid != dependency_pairs_cte.c.refobjid)
    recursive = recursive.join(anchor, dependency_pairs_cte.c.refobjid == anchor.c.objid)

    recursive_stmt = anchor.union(recursive)
    stmt = select(recursive_stmt)

    with engine.connect() as conn:
        result = conn.execute(stmt)

    return _get_structured_result(result)


# finding table dependents based on foreign key constraints from the referenced tables
def _get_table_dependents(foreign_key_dependents, pg_constraint_table):
    # TODO: update refobjsubid with actual values when working on columns
    pg_identify_object = _get_pg_identify_object_lateral_stmt(
        text(f'{PG_CLASS_CATALOGUE_NAME}::regclass::oid'), pg_constraint_table.c.conrelid, 0)

    pg_identify_refobject = _get_pg_identify_object_lateral_stmt(
        foreign_key_dependents.c.refclassid, foreign_key_dependents.c.refobjid, 0)

    # conrelid in this case is the oid of the table which a constraint resides in
    return select(
        foreign_key_dependents.c.classid,
        pg_constraint_table.c.conrelid.label('objid'),
        foreign_key_dependents.c.objsubid,
        foreign_key_dependents.c.refclassid,
        foreign_key_dependents.c.refobjid,
        foreign_key_dependents.c.refobjsubid,
        foreign_key_dependents.c.deptype,
        pg_identify_object.c.name.label('objname'),
        pg_identify_object.c.type.label('objtype'),
        pg_identify_refobject.c.name.label('refobjname'),
        pg_identify_refobject.c.type.label('refobjtype')) \
        .select_from(foreign_key_dependents) \
        .join(pg_constraint_table, pg_constraint_table.c.oid == foreign_key_dependents.c.objid) \
        .join(pg_identify_object, true()) \
        .join(pg_identify_refobject, true()) \
        .where(pg_constraint_table.c.confrelid != 0) \
        .group_by(
            foreign_key_dependents,
            pg_constraint_table.c.conrelid,
            pg_identify_object.c.name,
            pg_identify_object.c.type,
            pg_identify_refobject.c.name,
            pg_identify_refobject.c.type)


def _get_foreign_key_constraint_dependents(pg_identify_object, dependency_pair):
    return dependency_pair.where(pg_identify_object.c.type == 'table constraint')


# stmt for getting a full list of dependents and identifying them
def _get_dependency_pairs_stmt(pg_depend, pg_identify_object, pg_identify_refobject):
    result = select(
        pg_depend,
        pg_identify_object.c.name.label('objname'),
        pg_identify_object.c.type.label('objtype'),
        pg_identify_refobject.c.name.label('refobjname'),
        pg_identify_refobject.c.type.label('refobjtype')) \
        .select_from(pg_depend) \
        .join(pg_identify_object, true()) \
        .join(pg_identify_refobject, true()) \
        .where(pg_depend.c.deptype == any_(array(PG_DEPENDENT_TYPES))) \
        .where(pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID) \
        .group_by(
            pg_depend,
            pg_identify_object.c.name,
            pg_identify_object.c.type,
            pg_identify_refobject.c.name,
            pg_identify_refobject.c.type)

    return result


def _get_pg_depend_table(engine, metadata):
    return Table("pg_depend", metadata, autoload_with=engine)


def _get_pg_constraint_table(engine, metadata):
    return Table("pg_constraint", metadata, autoload_with=engine)


def _get_pg_identify_object_lateral_stmt(classid, objid, objsubid):
    return select(
        column("name"),
        column("type")) \
        .select_from(func.pg_identify_object(
            classid,
            objid,
            objsubid)) \
        .lateral()


def _get_typed_dependency_pairs_stmt(engine):
    metadata = MetaData()

    pg_depend = _get_pg_depend_table(engine, metadata)
    pg_identify_object = _get_pg_identify_object_lateral_stmt(
        pg_depend.c.classid, pg_depend.c.objid, pg_depend.c.objsubid)
    pg_identify_refobject = _get_pg_identify_object_lateral_stmt(
        pg_depend.c.refclassid, pg_depend.c.refobjid, 0)
    pg_constraint = _get_pg_constraint_table(engine, metadata)

    # each statement filters the base statement extracting dependents of a specific type
    # so it's easy to exclude particular types or add new
    dependency_pairs = _get_dependency_pairs_stmt(pg_depend, pg_identify_object, pg_identify_refobject)
    foreign_key_constraint_dependents = _get_foreign_key_constraint_dependents(pg_identify_object, dependency_pairs).cte('foreign_key_constraint_dependents')
    table_dependents = _get_table_dependents(foreign_key_constraint_dependents, pg_constraint).cte('table_dependents')

    return union(
        select(foreign_key_constraint_dependents),
        select(table_dependents))


def has_dependencies(referenced_object_id, engine, attnum=None):
    metadata = MetaData()

    pg_depend = _get_pg_depend_table(engine, metadata)

    stmt = select(
        exists(
            select().select_from(pg_depend)
            .where(pg_depend.c.refobjid == referenced_object_id)
            .where(pg_depend.c.deptype == any_(array(PG_DEPENDENT_TYPES)))
            .where(pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID)
        )
    )

    with engine.connect() as conn:
        result = conn.execute(stmt).scalar()

    return result


def _get_structured_result(dependency_graph_result):
    result = []
    for dependency_pair in dependency_graph_result:
        d = {}
        d['level'] = dependency_pair.level
        d['obj'] = {'objid': dependency_pair.objid, 'type': dependency_pair.objtype}
        d['parent_obj'] = {'objid': dependency_pair.refobjid, 'type': dependency_pair.refobjtype}
        result.append(d)

    return result
