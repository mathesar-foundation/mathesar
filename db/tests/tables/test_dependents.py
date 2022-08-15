from sqlalchemy import Column, ForeignKey, Integer, MetaData, PrimaryKeyConstraint, Table
from db.dependents.dependents_utils import get_dependents_graph
from db.tables.operations.select import get_oid_from_table
from db.constraints.operations.select import get_constraint_oid_by_name_and_table_oid


def test_table_dependents(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    t1 = Table(
        't1', metadata,
        Column('id', Integer, primary_key=True)
    )
    t1.create()
    t2 = Table(
        't2', metadata,
        Column('id', Integer, primary_key=True),
        Column('t1_id', Integer, ForeignKey(t1.c.id))
    )
    t2.create()

    t1_oid = get_oid_from_table(t1.name, schema, engine)
    t2_oid = get_oid_from_table(t2.name, schema, engine)
    t1_dependents_graph = get_dependents_graph(t1_oid, engine)

    t1_dependents = list(filter(lambda x: x['parent_obj']['objid'] == t1_oid, t1_dependents_graph))
    t2_dependents = list(filter(lambda x: x['parent_obj']['objid'] == t2_oid, t1_dependents_graph))

    assert len(t1_dependents_graph) == 5
    assert len(t1_dependents) == 3
    assert len(t2_dependents) == 2
    assert all(
        [
            r['level'] == 1
            for r in t1_dependents
        ]
    )
    assert all(
        [
            r['level'] == 2
            for r in t2_dependents
        ]
    )


def test_response_format(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    t1 = Table(
        't1', metadata,
        Column('id', Integer, primary_key=True)
    )
    t1.create()
    t2 = Table(
        't2', metadata,
        Column('id', Integer, primary_key=True),
        Column('t1_id', Integer, ForeignKey(t1.c.id))
    )
    t2.create()

    t1_oid = get_oid_from_table(t1.name, schema, engine)
    t1_dependents_graph = get_dependents_graph(t1_oid, engine)

    dependent_expected_attrs = ['obj', 'parent_obj', 'level']
    obj_expected_attrs = ['objid', 'type']
    parent_expected_attrs = ['objid']  # TODO: add type when it's returned for the parent obj
    assert all(
        [
            all(attr in dependent for attr in dependent_expected_attrs)
            for dependent in t1_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['obj'] for attr in obj_expected_attrs)
            for dependent in t1_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['parent_obj'] for attr in parent_expected_attrs)
            for dependent in t1_dependents_graph
        ]
    )


def test_graph_max_level(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    t0 = Table(
        't0', metadata,
        Column('id', Integer, primary_key=True))
    t0.create()

    for i in range(10):
        t = Table(
            f"t{i+1}", metadata,
            Column('id', Integer, primary_key=True),
            Column(f't{i}_id', Integer, ForeignKey(f"t{i}.id")))
        t.create()

    t0_oid = get_oid_from_table(t0.name, schema, engine)
    dependents = get_dependents_graph(t0_oid, engine)

    tables_count = len(metadata.tables.keys())
    assert tables_count == 11

    dependents_by_level = sorted(dependents, key=lambda x: x['level'], reverse=True)
    assert dependents_by_level[-1]['level'] == 1
    assert dependents_by_level[0]['level'] == 10


def test_specific_object_types(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    t1_pk_name = "t1_pk_name"
    t1 = Table(
        't1', metadata,
        Column('id', Integer),
        PrimaryKeyConstraint('id', name=t1_pk_name)
    )
    t1.create()

    t2_fk_name = "t2_fk_name"
    t2 = Table(
        't2', metadata,
        Column('id', Integer, primary_key=True),
        Column('t1_id', Integer, ForeignKey(t1.c.id, name=t2_fk_name)))
    t2.create()

    t1_oid = get_oid_from_table(t1.name, schema, engine)
    dependents = get_dependents_graph(t1_oid, engine)

    t1_pk_oid = get_constraint_oid_by_name_and_table_oid(t1_pk_name, t1_oid, engine)
    t2_oid = get_oid_from_table(t2.name, schema, engine)
    t2_fk_oid = get_constraint_oid_by_name_and_table_oid(t2_fk_name, t2_oid, engine)
    t1_dependent_oids = [d['obj']['objid'] for d in list(filter(lambda x: x['parent_obj']['objid'] == t1_oid, dependents))]

    assert t1_pk_oid in t1_dependent_oids
    assert t2_oid in t1_dependent_oids
    assert t2_fk_oid in t1_dependent_oids


def test_circular_referene(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    t1 = Table(
        't1', metadata,
        Column('id', Integer, primary_key=True)
    )

    t1.create()
    t2 = Table(
        't2', metadata,
        Column('id', Integer, primary_key=True),
        Column('t1_id', Integer, ForeignKey(t1.c.id))
    )
    t2.create()
    t1.append_column(Column('t2_id', Integer, ForeignKey(t2.c.id)))

    t1_oid = get_oid_from_table(t1.name, schema, engine)
    t2_oid = get_oid_from_table(t2.name, schema, engine)
    t1_dependents_graph = get_dependents_graph(t1_oid, engine)

    t2_dependents = list(filter(lambda x: x['parent_obj']['objid'] == t2_oid, t1_dependents_graph))
    t2_dependent_oids = [d['obj']['objid'] for d in list(filter(lambda x: x['parent_obj']['objid'] == t1_oid, t2_dependents))]

    dependents_by_level = sorted(t1_dependents_graph, key=lambda x: x['level'], reverse=True)
    assert dependents_by_level[0]['level'] == 2
    assert t1_oid not in t2_dependent_oids
