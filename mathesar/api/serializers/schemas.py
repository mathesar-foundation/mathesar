from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Schema


class ModelNameField(serializers.CharField):
    """
    De-serializes the request field as a string, but serializes the response field as
    `model.name`. Required to support passing and returing a model name from the
    endpoint, while also storing the model as a related field.
    """

    def to_representation(self, value):
        return value.name


class SchemaSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    name = serializers.CharField()
    database = ModelNameField(max_length=128)
    description = serializers.CharField(
        required=False, allow_blank=True, default=None, allow_null=True
    )
    num_tables = serializers.SerializerMethodField()
    num_queries = serializers.SerializerMethodField()

    class Meta:
        model = Schema
        fields = [
            'id', 'name', 'database', 'has_dependencies', 'description',
            'num_tables', 'num_queries'
        ]

    def get_num_tables(self, obj):
        return obj.tables.count()

    def get_num_queries(self, obj):
        return sum(t.queries.count() for t in obj.tables.all())
