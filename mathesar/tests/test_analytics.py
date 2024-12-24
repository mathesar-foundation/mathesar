"""
Test analytics functions.

Fixtures:
    monkeypatch(pytest): Lets you monkeypatch an object for testing.
    settings(pytest): Modify a django setting for a given test
"""
import time
from unittest.mock import patch
from django.core.cache import cache
from django.db import IntegrityError
import pytest
from mathesar import analytics
from mathesar.models.analytics import AnalyticsReport, InstallationID
from mathesar.models.base import Database, Server


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()


def test_non_blocking_wrapper(monkeypatch, settings):
    """
    A bit messy. Tests that the decorated function exits without
    waiting for the sleep command.
    """
    settings.TEST = False

    def mock_analytics_runner():
        time.sleep(0.5)
    monkeypatch.setattr(analytics, "run_analytics", mock_analytics_runner)

    @analytics.wire_analytics
    def myfunc():
        return
    start = time.time()
    myfunc()
    end = time.time()
    assert end - start < 0.1


def test_initialize_save_disable_analytics():
    assert len(InstallationID.objects.all()) == 0
    analytics.initialize_analytics()
    assert len(InstallationID.objects.all()) == 1
    analytics.save_analytics_report()
    assert len(AnalyticsReport.objects.all()) == 1
    analytics.disable_analytics()
    assert len(InstallationID.objects.all()) == 0
    assert len(AnalyticsReport.objects.all()) == 0


def test_analytics_installation_id_nongenerated_pkey():
    analytics.initialize_analytics()
    with pytest.raises(IntegrityError):
        analytics.initialize_analytics()


def test_analytics_upload_delete_stale(settings, monkeypatch):
    server = Server.objects.create(host='example.com', port=5432)
    Database.objects.create(name='db1', server=server)
    analytics.initialize_analytics()
    installation_id = InstallationID.objects.first()
    AnalyticsReport.objects.create(
        installation_id=installation_id,
        mathesar_version='123abc',
        user_count=3,
        active_user_count=2,
        configured_role_count=5,
        connected_database_count=2,
        connected_database_schema_count=10,
        connected_database_table_count=50,
        connected_database_record_count=10000,
        exploration_count=5,
    )
    AnalyticsReport.objects.create(
        installation_id=installation_id,
        mathesar_version='123abc',
        user_count=4,
        active_user_count=3,
        configured_role_count=6,
        connected_database_count=3,
        connected_database_schema_count=20,
        connected_database_table_count=60,
        connected_database_record_count=20000,
        exploration_count=10,
    )
    # This should be the default, but it's good to check
    assert len(AnalyticsReport.objects.filter(uploaded=False)) == 2
    with patch.object(analytics.requests, 'post') as mock_requests:
        analytics.upload_analytics_reports()
    mock_requests.assert_called_once()
    call_args = mock_requests.call_args
    assert call_args.args == (settings.MATHESAR_ANALYTICS_URL,)
    assert set(call_args.kwargs.keys()) == set(['json'])
    reports_blob = sorted(call_args.kwargs['json'], key=lambda d: d['id'])
    assert all([d['installation_id'] == str(installation_id.value) for d in reports_blob])
    assert all([d['mathesar_version'] == '123abc' for d in reports_blob])
    assert [d['user_count'] for d in reports_blob] == [3, 4]
    assert [d['active_user_count'] for d in reports_blob] == [2, 3]
    assert [d['configured_role_count'] for d in reports_blob] == [5, 6]
    assert [d['connected_database_count'] for d in reports_blob] == [2, 3]
    assert [d['connected_database_schema_count'] for d in reports_blob] == [10, 20]
    assert [d['connected_database_table_count'] for d in reports_blob] == [50, 60]
    assert [d['connected_database_record_count'] for d in reports_blob] == [10000, 20000]
    assert [d['exploration_count'] for d in reports_blob] == [5, 10]
    assert len(AnalyticsReport.objects.filter(uploaded=True)) == 2
    analytics.delete_stale_reports()
    assert len(AnalyticsReport.objects.all()) == 2
    AnalyticsReport.objects.all().update()
