import django.db.models
from django.db.models import Case, When, Value, F, Q, Count
from rest_access_policy import PermittedSlugRelatedField
from rest_framework import serializers
from mathesar.models.users import Role

from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Database, Schema


class SchemaSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    name = serializers.CharField()
    # Restrict access to databases with create access.
    # Unlike PermittedPkRelatedField this field uses a slug instead of an id
    # Refer https://rsinger86.github.io/drf-access-policy/policy_reuse/
    database = PermittedSlugRelatedField(
        access_policy=DatabaseAccessPolicy,
        slug_field='name',
        queryset=Database.current_objects.all()
    )
    description = serializers.CharField(
        required=False, allow_blank=True, default=None, allow_null=True
    )
    num_tables = serializers.SerializerMethodField()
    num_queries = serializers.SerializerMethodField()

    class Meta:
        model = Schema
        fields = [
            'id', 'name', 'database', 'has_dependents', 'description',
            'num_tables', 'num_queries'
        ]

    def get_num_tables(self, obj):
        confirmed_table_roles = (Role.EDITOR.value, Role.VIEWER.value)
        user = self.context['request'].user

        confirmed_table = "CONFIRMED"
        unconfirmed_table = "UNCONFIRMED"
        not_allowed = "NOT_ALLOWED"

        if not user.is_superuser:
            permissible_schema_role_filter = Q(schema__schema_role__role__in=confirmed_table_roles)
            permissible_table_view_filter = Q(import_verified=True) | Q(import_verified__isnull=True)

            qs = obj.tables.filter(schema__schema_role__user=user).annotate(
                to_count=Case(
                    When(permissible_schema_role_filter, then=Case(
                        When(permissible_table_view_filter, then=Value(confirmed_table)),
                        default=Value(unconfirmed_table)
                    )),
                    default=Value(not_allowed), output_field=django.db.models.CharField()
                )
            )
            count = qs.filter(Q(to_count=not_allowed) | Q(to_count=confirmed_table)).count()
        else:
            count = obj.tables.count()
        return count

    def get_num_queries(self, obj):
        return sum(t.queries.count() for t in obj.tables.all())
