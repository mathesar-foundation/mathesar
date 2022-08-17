from sqlalchemy import MetaData, Table, Column, Integer, PrimaryKeyConstraint, ForeignKeyConstraint
import pytest

from db.tables.operations.select import get_oid_from_table


@pytest.fixture
def post_comment_dependent_tables(engine_with_schema):
    engine, schema = engine_with_schema
    metadata = MetaData(schema=schema, bind=engine)
    post = Table(
        'post', metadata,
        Column('id', Integer),
        PrimaryKeyConstraint('id', name='pk_post')
    )
    post.create()

    comment = Table(
        'comment', metadata,
        Column('id', Integer),
        Column('post_id', Integer),
        PrimaryKeyConstraint('id', name='pk_comment'),
        ForeignKeyConstraint(['post_id'], ['post.id'], name='fk_comment_post')
    )
    comment.create()

    post_oid = get_oid_from_table(post.name, schema, engine)
    comment_oid = get_oid_from_table(comment.name, schema, engine)
    return post, post_oid, comment, comment_oid
