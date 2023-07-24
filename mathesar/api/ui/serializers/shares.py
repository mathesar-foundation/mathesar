from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.shares import SharedTable, SharedQuery


class SharedEntitySerializer(MathesarErrorMessageMixin, serializers.Serializer):
    class Meta:
        fields = ['id', 'slug', 'enabled']


class SharedTableSerializer(SharedEntitySerializer, serializers.ModelSerializer):
    class Meta:
        model = SharedTable
        fields = SharedEntitySerializer.Meta.fields


class SharedQuerySerializer(SharedEntitySerializer, serializers.ModelSerializer):
    class Meta:
        model = SharedQuery
        fields = SharedEntitySerializer.Meta.fields
