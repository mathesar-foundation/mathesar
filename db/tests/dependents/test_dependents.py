from sqlalchemy import Column, ForeignKey, Integer, MetaData, Table, text
from db.dependents.dependents_utils import get_dependents_graph
from db.tables.operations.select import get_oid_from_table
from db.constraints.operations.select import get_constraint_oid_by_name_and_table_oid


def _get_object_dependents(dependents_graph, object_oid):
    return list(filter(lambda x: x['parent_obj']['objid'] == object_oid, dependents_graph))


def _get_object_dependents_oids(dependents_graph, object_oid):
    return [dependent['obj']['objid'] for dependent in _get_object_dependents(dependents_graph, object_oid)]


def test_correct_dependents_amount_and_level(engine, academics_tables_oids):
    universities_dependents_graph = get_dependents_graph(academics_tables_oids['universities'], engine)

    universities_dependents = _get_object_dependents(universities_dependents_graph, academics_tables_oids['universities'])
    academics_dependents = _get_object_dependents(universities_dependents_graph, academics_tables_oids['academics'])
    journals_dependents = _get_object_dependents(universities_dependents_graph, academics_tables_oids['journals'])
    articles_dependents = _get_object_dependents(universities_dependents_graph, academics_tables_oids['articles'])

    assert len(universities_dependents) == 5
    assert len(journals_dependents) == 5
    assert len(articles_dependents) == 4
    assert len(academics_dependents) == 7
    assert all(
        [
            r['level'] == 1
            for r in universities_dependents
        ]
    )
    assert all(
        [
            r['level'] == 2
            for r in academics_dependents + journals_dependents
        ]
    )
    assert all(
        [
            r['level'] == 3
            for r in articles_dependents
        ]
    )


def test_response_format(engine, academics_tables_oids):
    universities_dependents_graph = get_dependents_graph(academics_tables_oids['universities'], engine)

    dependent_expected_attrs = ['obj', 'parent_obj', 'level']
    obj_expected_attrs = ['objid', 'type']
    parent_expected_attrs = ['objid']  # TODO: add 'type' when it's returned for the parent obj
    assert all(
        [
            all(attr in dependent for attr in dependent_expected_attrs)
            for dependent in universities_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['obj'] for attr in obj_expected_attrs)
            for dependent in universities_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['parent_obj'] for attr in parent_expected_attrs)
            for dependent in universities_dependents_graph
        ]
    )


# TODO: add other types when they are added as dependents
def test_specific_object_types(engine, academics_tables_oids, academics_db_tables):
    journals_oid = academics_tables_oids['journals']
    journals_dependents_graph = get_dependents_graph(journals_oid, engine)
    journals_dependents_oids = _get_object_dependents_oids(journals_dependents_graph, journals_oid)

    journals_constraint_oids = [
        get_constraint_oid_by_name_and_table_oid(constraint.name, journals_oid, engine)
        for constraint in academics_db_tables['journals'].constraints]
    
    articles_oid = academics_tables_oids['articles']
    articles_journals_fk = [c for c in academics_db_tables['articles'].foreign_key_constraints if 'journal' in c][0]
    articles_journals_fk_oid = get_constraint_oid_by_name_and_table_oid(articles_journals_fk.name, articles_oid, engine)

    assert sorted(journals_dependents_oids) == sorted(journals_constraint_oids + [articles_oid] + [articles_journals_fk_oid])


# if a table contains a foreign key referencing itself, it shouldn't be treated as a dependent
def test_self_reference(engine, academics_tables_oids):
    academics_oid = academics_tables_oids['academics']
    academics_dependents_graph = get_dependents_graph(academics_oid, engine)

    academics_dependents_oids = _get_object_dependents_oids(academics_dependents_graph, academics_oid)
    assert academics_oid not in academics_dependents_oids


# if two tables depend on each other, we should return dependence only for the topmost object in the graph
# excluding the possibility of circulal reference
def test_circular_reference(engine, academics_tables_oids, academics_db_tables):
    academics = academics_db_tables['academics']
    universities = academics_db_tables['universities']
    universities.append_column(Column('top_researcher', Integer, ForeignKey(academics.c.id)))
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE universities ADD COLUMN top_researcher integer'))
        conn.execute(text('ALTER TABLE universities ADD CONSTRAINT fk_univ_academics FOREIGN KEY (top_researcher) REFERENCES academics (id)'))
    
    universities_oid = academics_tables_oids['universities']
    academics_oid = academics_tables_oids['academics']

    universities_dependents_graph = get_dependents_graph(universities_oid, engine)
    academics_dependents_oids = _get_object_dependents_oids(universities_dependents_graph, academics_oid)

    assert universities_oid not in academics_dependents_oids


def test_dependents_graph_max_level(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    t0 = Table(
        't0', metadata,
        Column('id', Integer, primary_key=True))
    t0.create()

    for i in range(11):
        t = Table(
            f"t{i+1}", metadata,
            Column('id', Integer, primary_key=True),
            Column(f't{i}_id', Integer, ForeignKey(f"t{i}.id")))
        t.create()

    t0_oid = get_oid_from_table(t0.name, schema, engine)
    t0_dependents_graph = get_dependents_graph(t0_oid, engine)

    tables_count = len(metadata.tables.keys())
    assert tables_count == 12

    # by default, dependents graph max level is 10
    dependents_by_level = sorted(t0_dependents_graph, key=lambda x: x['level'])
    assert dependents_by_level[0]['level'] == 1
    assert dependents_by_level[-1]['level'] == 10
