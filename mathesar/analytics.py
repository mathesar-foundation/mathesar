"""
This module contains functions for dealing with analytics in Mathesar.

The basic principle is: If there is an installation_id, analytics are
"turned on", and can and will be collected. Otherwise they won't.

Thus, the `disable_analytics` function simply deletes that ID, if it
exists.
"""
from functools import wraps
import threading
from uuid import uuid4

from django.core.cache import cache
from django.conf import settings
from django.db.models import Q
from django.utils import timezone
import requests

from mathesar import __version__
from mathesar.models import (
    AnalyticsReport,
    ConfiguredRole,
    Database,
    Explorations,
    InstallationID,
    User,
)

ANALYTICS_DONE = "analytics_done"
CACHE_TIMEOUT = 1800  # seconds
ACTIVE_USER_DAYS = 14
ANALYTICS_REPORT_MAX_AGE = 30  # days
ANALYTICS_FREQUENCY = 1  # a report is saved at most once per day.


def wire_analytics(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if settings.TEST is False and cache.get(ANALYTICS_DONE) is None:
            cache.set(ANALYTICS_DONE, True, CACHE_TIMEOUT)
            threading.Thread(target=run_analytics).start()
        return f(*args, **kwargs)
    return wrapped


def run_analytics():
    if (
            InstallationID.objects.first() is not None
            and not AnalyticsReport.objects.filter(
                created_at__gte=timezone.now()
                - timezone.timedelta(days=ANALYTICS_FREQUENCY)
            )
    ):
        save_analytics_report()
        upload_analytics_reports()
        delete_stale_reports()


def initialize_analytics():
    InstallationID.objects.create(value=uuid4())


def disable_analytics():
    InstallationID.objects.all().delete()


def is_analytics_enabled():
    return InstallationID.objects.exists()


def save_analytics_report():
    raw_analytics_report = prepare_analytics_report()
    if raw_analytics_report["installation_id"] is not None:
        analytics_report = AnalyticsReport(**raw_analytics_report)
        analytics_report.save()


def prepare_analytics_report():
    installation_id = InstallationID.objects.first()
    connected_database_count = 0
    connected_database_schema_count = 0
    connected_database_table_count = 0
    connected_database_record_count = 0
    for d in Database.objects.all():
        try:
            object_counts = d.object_counts
            connected_database_count += 1
            connected_database_schema_count += object_counts['schema_count']
            connected_database_table_count += object_counts['table_count']
            connected_database_record_count += object_counts['record_count']
        except Exception:
            print(f"Couldn't retrieve object counts for {d.name}")

    return dict(
        installation_id=installation_id,
        mathesar_version=__version__,
        user_count=User.objects.filter(is_active=True).count(),
        active_user_count=User.objects.filter(
            is_active=True,
            last_login__gte=timezone.now()
            - timezone.timedelta(days=ACTIVE_USER_DAYS)
        ).count(),
        configured_role_count=ConfiguredRole.objects.count(),
        connected_database_count=connected_database_count,
        connected_database_schema_count=connected_database_schema_count,
        connected_database_table_count=connected_database_table_count,
        connected_database_record_count=connected_database_record_count,
        exploration_count=Explorations.objects.count(),
    )


def upload_analytics_reports():
    reports = AnalyticsReport.objects.filter(uploaded=False)
    reports_blob = [
        {
            "id": report.id,
            "created_at": report.created_at.isoformat(),
            "installation_id": str(report.installation_id.value),
            "mathesar_version": report.mathesar_version,
            "user_count": report.user_count,
            "active_user_count": report.active_user_count,
            "configured_role_count": report.configured_role_count,
            "connected_database_count": report.connected_database_count,
            "connected_database_schema_count": report.connected_database_schema_count,
            "connected_database_table_count": report.connected_database_table_count,
            "connected_database_record_count": report.connected_database_record_count,
            "exploration_count": report.exploration_count,
        }
        for report in reports
    ]
    requests.post(settings.MATHESAR_ANALYTICS_URL, json=reports_blob)
    reports.update(uploaded=True)


def delete_stale_reports():
    AnalyticsReport.objects.filter(
        Q(
            # Delete uploaded analytics objects older than 2 days
            uploaded=True,
            created_at__lte=timezone.now() - timezone.timedelta(days=2)
        ) | Q(
            # Delete analytics reports after a time regardless of upload status
            updated_at__lte=timezone.now()
            - timezone.timedelta(days=ANALYTICS_REPORT_MAX_AGE)
        )
    ).delete()


def upload_initial_report():
    """Upload an initial report when Mathesar is installed"""
    requests.post(
        settings.MATHESAR_INIT_REPORT_URL,
        json={"mathesar_version": __version__}
    )
