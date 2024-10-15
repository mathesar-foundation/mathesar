from rest_access_policy import PermittedPkRelatedField
from rest_framework import serializers

from db.identifiers import is_identifier_too_long

from mathesar.api.db.permissions.table import TableAccessPolicy
from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.deprecated import Connection, Schema, Table
from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions
)


class SchemaSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    name = serializers.CharField()
    # Restrict access to databases with create access.
    # Refer https://rsinger86.github.io/drf-access-policy/policy_reuse/
    connection_id = PermittedPkRelatedField(
        source='database',
        access_policy=DatabaseAccessPolicy,
        queryset=Connection.current_objects.all()
    )
    description = serializers.CharField(
        required=False, allow_blank=True, default=None, allow_null=True
    )
    num_tables = serializers.SerializerMethodField()
    num_queries = serializers.SerializerMethodField()

    class Meta:
        model = Schema
        fields = [
            'id', 'name', 'connection_id', 'has_dependents', 'description',
            'num_tables', 'num_queries'
        ]

    def get_num_tables(self, obj):
        qs = Table.objects.filter(schema=obj)
        count = TableAccessPolicy.scope_queryset(self.context['request'], qs).count()
        return count

    def get_num_queries(self, obj):
        return sum(t.queries.count() for t in obj.tables.all())

    def validate_name(self, name):
        if is_identifier_too_long(name):
            raise database_api_exceptions.IdentifierTooLong(field='name')
        return name
