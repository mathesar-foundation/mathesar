from sqlalchemy import MetaData, any_, column, exists, func, literal, select, text, true, union, and_, collate
import warnings
from sqlalchemy.dialects.postgresql import array

from db.utils import get_pg_catalog_table

# OIDs assigned during normal database operation are constrained to be 16384 or higher.
USER_DEFINED_OBJECTS_MIN_OID = 16384
# automatic and normal dependents
PG_DEPENDENT_TYPES = ['a', 'n']
DEFAULT_NON_COLUMN_OBJSUBID = 0
PG_CLASS_CATALOGUE_NAME = '\'pg_class\''
START_LEVEL = 1
MAX_LEVEL = 10


def get_dependents_graph(referenced_object_id, engine, exclude_types, attnum=None):
    dependency_pairs = _get_typed_dependency_pairs_stmt(engine, exclude_types)
    dependency_pairs_cte = dependency_pairs.cte(recursive=True, name='dependency_pairs_cte')

    pg_identify_refobject = _get_pg_identify_object_lateral_stmt(
        dependency_pairs_cte.c.refclassid,
        dependency_pairs_cte.c.refobjid,
        (DEFAULT_NON_COLUMN_OBJSUBID if attnum is None else attnum)
    )

    # anchor member which includes all dependents of a requested object
    anchor = (
        select(
            dependency_pairs_cte,
            pg_identify_refobject.c.name.label('refobjname'),
            pg_identify_refobject.c.type.label('refobjtype'),
            literal(START_LEVEL).label('level'),
            array([dependency_pairs_cte.c.refobjid]).label('dependency_chain')
        )
        .join(pg_identify_refobject, true())
        .where(dependency_pairs_cte.c.refobjid == referenced_object_id)
        .where(dependency_pairs_cte.c.objid != referenced_object_id)
    )

    if (attnum is not None):
        anchor = anchor.where(dependency_pairs_cte.c.refobjsubid == attnum)

    anchor = anchor.cte('cte')

    # recursive member which includes dependents for each object of the previous level
    recursive = (
        select(
            dependency_pairs_cte,
            anchor.c.objname.label('refobjname'),
            anchor.c.objtype.label('refobjtype'),
            (anchor.c.level + 1),
            anchor.c.dependency_chain + array([anchor.c.objid])
        )
        .where(anchor.c.level < MAX_LEVEL)
        .where(dependency_pairs_cte.c.objid != any_(anchor.c.dependency_chain))
        .where(dependency_pairs_cte.c.objid != dependency_pairs_cte.c.refobjid)
    )

    recursive = recursive.join(anchor, dependency_pairs_cte.c.refobjid == anchor.c.objid)

    stmt = select(anchor.union(recursive))

    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="SELECT statement has a cartesian product")
        with engine.connect() as conn:
            result = conn.execute(stmt)

    return _get_structured_result(result)


def _get_constraint_dependents(pg_identify_object, dependency_pairs):
    return dependency_pairs.where(pg_identify_object.c.type == 'table constraint')


def _get_index_dependents(pg_identify_object, dependency_pairs):
    return dependency_pairs.where(pg_identify_object.c.type == 'index')


def _get_rule_dependents(pg_identify_object, dependency_pairs):
    return dependency_pairs.where(pg_identify_object.c.type == 'rule')


def _get_trigger_dependents(pg_depend, pg_identify_object, pg_trigger):
    return (
        select(
            pg_depend,
            # for some reason, tgname column is in C collation which collides with other columns collations
            collate(pg_trigger.c.tgname, 'default').label('objname'),
            pg_identify_object.c.type.label('objtype')
        )
        .select_from(pg_depend)
        .join(pg_identify_object, true())
        .join(pg_trigger, pg_trigger.c.oid == pg_depend.c.objid)
        .where(pg_depend.c.deptype == any_(array(PG_DEPENDENT_TYPES)))
        .where(pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID)
        .where(pg_identify_object.c.type == 'trigger')
        .group_by(
            pg_depend,
            pg_trigger.c.tgname,
            pg_identify_object.c.type)
    )


def _get_sequence_dependents(pg_identify_object, dependency_pairs):
    return dependency_pairs.where(pg_identify_object.c.type == 'sequence')


def _get_view_dependents(pg_identify_object, pg_rewrite_table, rule_dependents):
    pg_identify_object = _get_pg_identify_object_lateral_stmt(
        text(f'{PG_CLASS_CATALOGUE_NAME}::regclass::oid'), pg_rewrite_table.c.ev_class, DEFAULT_NON_COLUMN_OBJSUBID)

    return select(
        rule_dependents.c.classid,
        pg_rewrite_table.c.ev_class.label('objid'),
        rule_dependents.c.objsubid,
        rule_dependents.c.refclassid,
        rule_dependents.c.refobjid,
        rule_dependents.c.refobjsubid,
        rule_dependents.c.deptype,
        pg_identify_object.c.name.label('objname'),
        pg_identify_object.c.type.label('objtype')) \
        .select_from(rule_dependents) \
        .join(pg_rewrite_table, rule_dependents.c.objid == pg_rewrite_table.c.oid) \
        .join(pg_identify_object, true()) \
        .group_by(
            rule_dependents,
            pg_rewrite_table.c.ev_class,
            pg_identify_object.c.type,
            pg_identify_object.c.name)


def _get_table_dependents(pg_identify_object, base):
    return base.where(pg_identify_object.c.type == 'table')


def _get_function_dependents(pg_depend, pg_identify_object, pg_proc):
    return (
        select(
            pg_depend,
            # the same as with pg_trigger table
            collate(pg_proc.c.proname, 'default').label('objname'),
            pg_identify_object.c.type.label('objtype')
        )
        .select_from(pg_depend)
        .join(pg_identify_object, true())
        .join(pg_proc, pg_proc.c.oid == pg_depend.c.objid)
        .where(pg_depend.c.deptype == any_(array(PG_DEPENDENT_TYPES)))
        .where(pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID)
        .where(pg_identify_object.c.type == 'function')
        .group_by(
            pg_depend,
            pg_proc.c.proname,
            pg_identify_object.c.type)
    )


# stmt for getting a full list of dependents and identifying them
def _get_dependency_pairs_stmt(pg_depend, pg_identify_object):
    result = (
        select(
            pg_depend,
            pg_identify_object.c.name.label('objname'),
            pg_identify_object.c.type.label('objtype')
        )
        .select_from(pg_depend)
        .join(pg_identify_object, true())
        .where(pg_depend.c.deptype == any_(array(PG_DEPENDENT_TYPES)))
        .where(pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID)
        .group_by(
            pg_depend,
            pg_identify_object.c.name,
            pg_identify_object.c.type)
    )

    return result


def _get_pg_depend_table(engine, metadata):
    return get_pg_catalog_table("pg_depend", engine, metadata=metadata)


def _get_pg_rewrite(engine, metadata):
    return get_pg_catalog_table("pg_rewrite", engine, metadata=metadata)


def _get_pg_trigger(engine, metadata):
    return get_pg_catalog_table('pg_trigger', engine, metadata=metadata)


def _get_pg_proc(engine, metadata):
    return get_pg_catalog_table('pg_proc', engine, metadata=metadata)


def _get_pg_identify_object_lateral_stmt(classid, objid, objsubid):
    return (
        select(
            column("name"),
            column("type")
        )
        .select_from(func.pg_identify_object(
            classid,
            objid,
            objsubid))
        .lateral()
    )


def _get_typed_dependency_pairs_stmt(engine, exclude_types):
    metadata = MetaData()

    pg_depend = _get_pg_depend_table(engine, metadata)
    pg_identify_object = _get_pg_identify_object_lateral_stmt(
        pg_depend.c.classid, pg_depend.c.objid, pg_depend.c.objsubid)
    pg_rewrite = _get_pg_rewrite(engine, metadata)
    pg_trigger = _get_pg_trigger(engine, metadata)
    pg_proc = _get_pg_proc(engine, metadata)

    type_dependents = {}
    # each statement filters the base statement extracting dependents of a specific type
    # so it's easy to exclude particular types or add new
    dependency_pairs = _get_dependency_pairs_stmt(pg_depend, pg_identify_object)
    constraint_dependents = _get_constraint_dependents(pg_identify_object, dependency_pairs).cte('constraint_dependents')
    type_dependents['table constraint'] = constraint_dependents

    table_dependents = _get_table_dependents(pg_identify_object, dependency_pairs).cte('table_dependents')
    type_dependents['table'] = table_dependents

    # should not be returned directly, used for getting views
    # this relation is required because views in PostgreSQL are implemented using the rule system
    # views don't depend on tables directly but through rules, that are mapped one-to-one
    rule_dependents = _get_rule_dependents(pg_identify_object, dependency_pairs).cte('rule_dependents')
    view_dependents = _get_view_dependents(pg_identify_object, pg_rewrite, rule_dependents).cte('view_dependents')
    type_dependents['view'] = view_dependents

    index_dependents = _get_index_dependents(pg_identify_object, dependency_pairs).cte('index_dependents')
    type_dependents['index'] = index_dependents

    trigger_dependents = _get_trigger_dependents(pg_depend, pg_identify_object, pg_trigger).cte('trigger_dependents')
    type_dependents['trigger'] = [trigger_dependents]

    sequence_dependents = _get_sequence_dependents(pg_identify_object, dependency_pairs).cte('sequence_dependents')
    type_dependents['sequence'] = [sequence_dependents]

    # only schemas' function dependents
    function_dependents = _get_function_dependents(pg_depend, pg_identify_object, pg_proc).cte('function_dependents')
    type_dependents['function'] = [function_dependents]

    dependent_selects = [
        select(dependent)
        for type, dependent in type_dependents.items()
        if type not in exclude_types]

    return union(*dependent_selects)


def has_dependents(referenced_object_id, engine, attnum=None):
    metadata = MetaData()

    pg_depend = _get_pg_depend_table(engine, metadata)

    conditions = [
        pg_depend.c.refobjid == referenced_object_id,
        pg_depend.c.deptype == any_(array(PG_DEPENDENT_TYPES)),
        pg_depend.c.objid >= USER_DEFINED_OBJECTS_MIN_OID
    ]

    if attnum is not None:
        conditions.append(pg_depend.c.refobjsubid == (0 if attnum is None else attnum))

    stmt = select(
        exists(
            select().select_from(pg_depend)
            .where(and_(*conditions))
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
        d['obj'] = {
            'objid': dependency_pair.objid,
            'type': dependency_pair.objtype,
            'name': dependency_pair.objname
        }
        d['parent_obj'] = {
            'objid': dependency_pair.refobjid,
            'type': dependency_pair.refobjtype,
            'objsubid': (dependency_pair.refobjsubid if dependency_pair.refobjsubid != 0 else None),
            'name': dependency_pair.refobjname
        }
        result.append(d)

    return result
