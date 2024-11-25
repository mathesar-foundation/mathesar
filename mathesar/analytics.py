from datetime import datetime, timedelta
from uuid import uuid4
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
    for d in Database.objects.all():
        try:
            object_counts = d.object_counts
            connected_database_count += 1
            connected_database_schema_count += object_counts['schema_count']
            connected_database_table_count += object_counts['table_count']
        except Exception:
            print(f"Couldn't retrieve object counts for {d.name}")

    analytics_report = AnalyticsReport(
        installation_id=installation_id,
        mathesar_version=__version__,
        user_count=User.objects.filter(is_active=True).count(),
        active_user_count=User.objects.filter(
            is_active=True, last_login__gte=datetime.now() - timedelta(days=1)
        ).count(),
        configured_role_count=ConfiguredRole.objects.count(),
        connected_database_count=connected_database_count,
        connected_database_schema_count=connected_database_schema_count,
        connected_database_table_count=connected_database_table_count,
        exploration_count=Explorations.objects.count(),
    )
    analytics_report.save()
