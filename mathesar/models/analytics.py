from django.db import models
from mathesar.models.base import BaseModel


class InstallationID(BaseModel):
    # We shouldn't increment this, since only one row is allowed.
    id = models.IntegerField(primary_key=True, default=1)
    value = models.UUIDField()


class AnalyticsReport(BaseModel):
    installation_id = models.ForeignKey(
        'InstallationID', default=1, on_delete=models.CASCADE
    )
    mathesar_version = models.CharField()
    user_count = models.PositiveIntegerField(null=True, blank=True)
    active_user_count = models.PositiveIntegerField(null=True, blank=True)
    configured_role_count = models.PositiveIntegerField(null=True, blank=True)
    connected_database_count = models.PositiveIntegerField(null=True, blank=True)
    connected_database_schema_count = models.PositiveIntegerField(null=True, blank=True)
    connected_database_table_count = models.PositiveIntegerField(null=True, blank=True)
    connected_database_record_count = models.PositiveBigIntegerField(null=True, blank=True)
    exploration_count = models.PositiveIntegerField(null=True, blank=True)
    uploaded = models.BooleanField(default=False)
