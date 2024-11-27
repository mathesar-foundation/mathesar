"""
This module contains functions for dealing with analytics in Mathesar.

The basic principle is: If there is an installation_id, analytics are
"turned on", and can and will be collected. Otherwise they won't.

Thus, the `disable_analytics` function simply deletes that ID, if it
exists.
"""
from uuid import uuid4

from django.conf import settings
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


def initialize_analytics():
    installation_id = InstallationID(value=uuid4())
    installation_id.save()


def disable_analytics():
    InstallationID.objects.all().delete()


def save_analytics_report():
    installation_id = InstallationID.objects.first()
    if installation_id is None:
        return
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

    analytics_report = AnalyticsReport(
        installation_id=installation_id,
        mathesar_version=__version__,
        user_count=User.objects.filter(is_active=True).count(),
        active_user_count=User.objects.filter(
            is_active=True, last_login__gte=timezone.now() - timezone.timedelta(days=14)
        ).count(),
        configured_role_count=ConfiguredRole.objects.count(),
        connected_database_count=connected_database_count,
        connected_database_schema_count=connected_database_schema_count,
        connected_database_table_count=connected_database_table_count,
        connected_database_record_count=connected_database_record_count,
        exploration_count=Explorations.objects.count(),
    )
    analytics_report.save()


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
    AnalyticsReport.objects.filter(uploaded=True).delete()
