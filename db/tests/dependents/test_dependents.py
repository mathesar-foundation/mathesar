from sqlalchemy import Column, ForeignKey, Integer, MetaData, PrimaryKeyConstraint, Table
from db.dependents.dependents_utils import get_dependents_graph
from db.tables.operations.select import get_oid_from_table
from db.constraints.operations.select import get_constraint_oid_by_name_and_table_oid


def _get_object_dependents(dependents_graph, object_oid):
    return list(filter(lambda x: x['parent_obj']['objid'] == object_oid, dependents_graph))


def _get_object_dependent_oids(dependents_graph, object_oid):
    return [dependent['obj']['objid'] for dependent in _get_object_dependents(dependents_graph, object_oid)]


def test_correct_dependents_amount(engine, post_comment_dependent_tables):
    _, post_oid, _, comment_oid = post_comment_dependent_tables

    post_dependents_graph = get_dependents_graph(post_oid, engine)

    post_dependents = _get_object_dependents(post_dependents_graph, post_oid) 
    comment_dependents = _get_object_dependents(post_dependents_graph, comment_oid) 

    assert len(post_dependents_graph) == 5
    assert len(post_dependents) == 3
    assert len(comment_dependents) == 2
    assert all(
        [
            r['level'] == 1
            for r in post_dependents
        ]
    )
    assert all(
        [
            r['level'] == 2
            for r in comment_dependents
        ]
    )


def test_response_format(engine, post_comment_dependent_tables):
    _, post_oid, _, _ = post_comment_dependent_tables

    post_dependents_graph = get_dependents_graph(post_oid, engine)

    dependent_expected_attrs = ['obj', 'parent_obj', 'level']
    obj_expected_attrs = ['objid', 'type']
    parent_expected_attrs = ['objid']  # TODO: add 'type' when it's returned for the parent obj
    assert all(
        [
            all(attr in dependent for attr in dependent_expected_attrs)
            for dependent in post_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['obj'] for attr in obj_expected_attrs)
            for dependent in post_dependents_graph
        ]
    )
    assert all(
        [
            all(attr in dependent['parent_obj'] for attr in parent_expected_attrs)
            for dependent in post_dependents_graph
        ]
    )


def test_specific_object_types(engine, post_comment_dependent_tables):
    post, post_oid, comment, comment_oid = post_comment_dependent_tables

    post_dependents_graph = get_dependents_graph(post_oid, engine)

    post_pk_oid = get_constraint_oid_by_name_and_table_oid(post.primary_key.name, post_oid, engine)
    comment_fk_oid = get_constraint_oid_by_name_and_table_oid(comment.foreign_key_constraints.pop().name, comment_oid, engine)

    post_dependents_oids = _get_object_dependent_oids(post_dependents_graph, post_oid)

    assert sorted([post_pk_oid, comment_fk_oid, comment_oid]) == sorted(post_dependents_oids)


# if two tables depend on each other, we should display dependence for the topmost object in the graph
# excluding the possibility of circulal reference
def test_circular_referene(engine, post_comment_dependent_tables):
    post, post_oid, comment, comment_oid = post_comment_dependent_tables
    post.append_column(Column('comment_id', Integer, ForeignKey(comment.c.id)))

    post_dependents_graph = get_dependents_graph(post_oid, engine)

    comment_dependent_oids = _get_object_dependent_oids(post_dependents_graph, comment_oid)
    assert post_oid not in comment_dependent_oids


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
    dependents = get_dependents_graph(t0_oid, engine)

    tables_count = len(metadata.tables.keys())
    assert tables_count == 12

    # by default, dependents graph max level is 10
    dependents_by_level = sorted(dependents, key=lambda x: x['level'])
    assert dependents_by_level[0]['level'] == 1
    assert dependents_by_level[-1]['level'] == 10