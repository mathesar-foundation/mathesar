from rest_access_policy import PermittedSlugRelatedField
from rest_framework import serializers

from mathesar.api.db.permissions.table import TableAccessPolicy

from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Database, Schema, Table


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
        qs = Table.objects.filter(schema=obj)
        count = TableAccessPolicy.scope_queryset(self.context['request'], qs).distinct().count()
        return count

    def get_num_queries(self, obj):
        return sum(t.queries.count() for t in obj.tables.all())
