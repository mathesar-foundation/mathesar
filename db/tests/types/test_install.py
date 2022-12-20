from sqlalchemy import text
from db.types import install
from db.types import base
from db.types.custom import email
from db.types.install import install_mathesar_on_database


def test_create_type_schema(engine):
    install.create_type_schema(engine)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT * FROM information_schema.schemata"))
    schemata = {row['schema_name'] for row in res.fetchall()}
    assert base.SCHEMA in schemata


def test_create_type_schema_when_exists(engine):
    # This just checks that the function doesn't error if the type schema
    # already exists when it's run.
    install.create_type_schema(engine)
    install.create_type_schema(engine)


def test_create_email_when_exists(engine):
    # This just checks that the function doesn't error if the type email
    # already exists when it's run.
    email.install(engine)
    email.install(engine)


def test_install_when_exists(engine):
    # This just checks that the function is idempotent
    install_mathesar_on_database(engine)
    install_mathesar_on_database(engine)
