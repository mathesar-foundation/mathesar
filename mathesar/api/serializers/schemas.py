from rest_framework import serializers
from rest_framework.relations import SlugRelatedField

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Database, Schema


class SchemaSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    name = serializers.CharField()
    database = SlugRelatedField(slug_field='name', queryset=Database.current_objects.all())
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
        return obj.tables.count()

    def get_num_queries(self, obj):
        return sum(t.queries.count() for t in obj.tables.all())
