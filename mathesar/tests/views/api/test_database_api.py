import pytest
from django.conf import settings
from django.core.cache import cache

from mathesar.views.api import reflect_db_objects
from mathesar.models import Table, Schema, Database


TEST_DB = "test_database_api_db"


@pytest.fixture
def database_api_db(test_db_name):
    settings.DATABASES[TEST_DB] = settings.DATABASES[test_db_name]
    yield TEST_DB
    if TEST_DB in settings.DATABASES:
        del settings.DATABASES[TEST_DB]


def test_database_reflection_new(database_api_db):
    cache.clear()
    reflect_db_objects()
    assert Database.objects.filter(name=database_api_db).exists()


def test_database_reflection_delete(database_api_db):
    cache.clear()
    reflect_db_objects()
    db = Database.objects.get(name=database_api_db)
    assert db.deleted is False

    cache.clear()
    del settings.DATABASES[database_api_db]
    reflect_db_objects()
    db.refresh_from_db()
    assert db.deleted is True


def test_database_reflection_delete_schema(database_api_db):
    cache.clear()
    reflect_db_objects()
    db = Database.objects.get(name=database_api_db)

    Schema.objects.create(oid=1, database=db)
    # We expect the test schema + 'public'
    assert Schema.objects.filter(database=db).count() == 2

    cache.clear()
    del settings.DATABASES[database_api_db]
    reflect_db_objects()
    assert Schema.objects.filter(database=db).count() == 0


def test_database_reflection_delete_table(database_api_db):
    cache.clear()
    reflect_db_objects()
    db = Database.objects.get(name=database_api_db)

    schema = Schema.objects.create(oid=1, database=db)
    Table.objects.create(oid=2, schema=schema)
    assert Table.objects.filter(schema__database=db).count() == 1

    cache.clear()
    del settings.DATABASES[database_api_db]
    reflect_db_objects()
    assert Table.objects.filter(schema__database=db).count() == 0
