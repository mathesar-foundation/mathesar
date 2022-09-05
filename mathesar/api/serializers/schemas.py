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

    class Meta:
        model = Schema
        fields = ['id', 'name', 'database', 'has_dependents']
