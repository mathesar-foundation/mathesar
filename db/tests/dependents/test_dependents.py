from sqlalchemy import Column, ForeignKey, Integer, MetaData, Table, text, select, Index
from sqlalchemy_utils import create_view
from db.dependents.dependents_utils import get_dependents_graph
from db.tables.operations.select import get_oid_from_table
from db.constraints.operations.select import get_constraint_oid_by_name_and_table_oid


def _get_object_dependents(dependents_graph, object_oid):
    return list(filter(lambda x: x['parent_obj']['objid'] == object_oid, dependents_graph))


def _get_object_dependents_oids(dependents_graph, object_oid):
    return [dependent['obj']['objid'] for dependent in _get_object_dependents(dependents_graph, object_oid)]


def _get_object_dependents_by_type(dependents_graph, object_oid, type):
    return [dependent['obj']['objid'] for dependent in _get_object_dependents(dependents_graph, object_oid) if dependent['obj']['type'] == type]


def test_correct_dependents_amount_and_level(engine, library_tables_oids):
    publishers_dependents_graph = get_dependents_graph(library_tables_oids['Publishers'], engine)

    publishers_dependents = _get_object_dependents(publishers_dependents_graph, library_tables_oids['Publishers'])
    publications_dependents = _get_object_dependents(publishers_dependents_graph, library_tables_oids['Publications'])
    items_dependents = _get_object_dependents(publishers_dependents_graph, library_tables_oids['Items'])
    checkouts_dependents = _get_object_dependents(publishers_dependents_graph, library_tables_oids['Checkouts'])

    assert len(publishers_dependents) == 3
    assert len(publications_dependents) == 5
    assert len(items_dependents) == 4
    assert len(checkouts_dependents) == 3
    assert all(
        [
            r['level'] == 1
            for r in publishers_dependents
        ]
    )
    assert all(
        [
            r['level'] == 2
            for r in publications_dependents
        ]
    )
    assert all(
        [
            r['level'] == 3
            for r in items_dependents
        ]
    )
    assert all(
        [
            r['level'] == 4
            for r in checkouts_dependents
        ]
    )


def test_response_format(engine, library_tables_oids):
    publishers_dependents_graph = get_dependents_graph(library_tables_oids['Publishers'], engine)

    dependent_expected_attrs = ['obj', 'parent_obj', 'level']
    obj_expected_attrs = ['objid', 'type']
    assert all(
        [
            all(attr in dependent for attr in dependent_expected_attrs)
            for dependent in publishers_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['obj'] for attr in obj_expected_attrs)
            for dependent in publishers_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['parent_obj'] for attr in obj_expected_attrs)
            for dependent in publishers_dependents_graph
        ]
    )


# TODO: add other types when they are added as dependents
def test_specific_object_types(engine, library_tables_oids, library_db_tables):
    items_oid = library_tables_oids['Items']
    items_dependents_graph = get_dependents_graph(items_oid, engine)
    items_dependents_oids = _get_object_dependents_oids(items_dependents_graph, items_oid)

    items_constraint_oids = [
        get_constraint_oid_by_name_and_table_oid(constraint.name, items_oid, engine)
        for constraint in library_db_tables['Items'].constraints]

    checkouts_oid = library_tables_oids['Checkouts']
    checkouts_items_fk = [c for c in library_db_tables['Checkouts'].foreign_key_constraints if 'Item' in c][0]
    checkouts_items_fk_oid = get_constraint_oid_by_name_and_table_oid(checkouts_items_fk.name, checkouts_oid, engine)

    assert sorted(items_dependents_oids) == sorted(items_constraint_oids + [checkouts_oid] + [checkouts_items_fk_oid])


# if a table contains a foreign key referencing itself, it shouldn't be treated as a dependent
def test_self_reference(engine, library_tables_oids):
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE "Publishers" ADD COLUMN "Parent Publisher" integer'))
        conn.execute(text('ALTER TABLE "Publishers" ADD CONSTRAINT "Publishers_Publisher_fkey" FOREIGN KEY ("Parent Publisher") REFERENCES "Publishers" (id)'))

    publishers_oid = library_tables_oids['Publishers']
    publishers_dependents_graph = get_dependents_graph(publishers_oid, engine)

    publishers_dependents_oids = _get_object_dependents_oids(publishers_dependents_graph, publishers_oid)
    assert publishers_oid not in publishers_dependents_oids


# if two tables depend on each other, we should return dependence only for the topmost object in the graph
# excluding the possibility of circulal reference
def test_circular_reference(engine, library_tables_oids):
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE "Publishers" ADD COLUMN "Top Publication" integer'))
        conn.execute(text('ALTER TABLE "Publishers" ADD CONSTRAINT "Publishers_Publications_fkey" FOREIGN KEY ("Top Publication") REFERENCES "Publications" (id)'))

    publishers_oid = library_tables_oids['Publishers']
    publications_oid = library_tables_oids['Publications']

    publishers_dependents_graph = get_dependents_graph(publishers_oid, engine)
    publications_dependents_oids = _get_object_dependents_oids(publishers_dependents_graph, publications_oid)

    assert publishers_oid not in publications_dependents_oids


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


def test_views_as_dependents(engine_with_schema, library_db_tables, library_tables_oids):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)

    publications = library_db_tables['Publications']
    new_publications_view = select(publications).where(publications.c['Publication Year'] >= 2000)
    create_view('new_publications', new_publications_view, metadata)
    metadata.create_all(engine)

    publications_oid = library_tables_oids['Publications']
    publications_dependents_graph = get_dependents_graph(publications_oid, engine)
    publications_view_dependents = _get_object_dependents_by_type(publications_dependents_graph, publications_oid, 'view')

    assert len(publications_view_dependents) == 1


def test_indexex_as_dependents(engine, library_db_tables, library_tables_oids):
    index = Index('someindex', library_db_tables['Publishers'].c.id)
    index.create(engine)

    publishers_dependents_graph = get_dependents_graph(library_tables_oids['Publishers'], engine)
    publishers_dependents = _get_object_dependents(publishers_dependents_graph, library_tables_oids['Publishers'])

    assert 'index' in [dependent['obj']['type'] for dependent in publishers_dependents]
