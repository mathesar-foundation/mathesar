from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from mathesar.models.base import BaseModel, Database, Schema


class User(AbstractUser):
    # Name fields are changed to mitigate some of the issues in
    # https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/
    # We can get by with a "full name" and "short name" to display in different contexts
    # Both are optional because we can always fall back on username
    first_name = None
    last_name = None
    full_name = models.CharField(max_length=255, blank=True, null=True)
    short_name = models.CharField(max_length=255, blank=True, null=True)


class Role(models.TextChoices):
    MANAGER = 'manager', 'Manager'
    EDITOR = 'editor', 'Editor'
    VIEWER = 'viewer', 'Viewer'


class DatabaseRole(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='database_roles')
    database = models.ForeignKey(Database, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=Role.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'database'], name='unique_database_role')
        ]


class SchemaRole(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='schema_roles')
    schema = models.ForeignKey(Schema, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=Role.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'schema'], name='unique_schema_role')
        ]
