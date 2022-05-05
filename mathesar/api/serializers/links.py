from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.columns import SimpleColumnSerializer
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.api.serializers.tables import TableSerializer


class OneToOneSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    column = SimpleColumnSerializer(required=False)
    column_id = serializers.PrimaryKeyRelatedField(required=False)
    referent_column_id = serializers.PrimaryKeyRelatedField()


class ManyToManySerializer(MathesarErrorMessageMixin, serializers.Serializer):
    referent_columns = serializers.PrimaryKeyRelatedField(many=True)
    map_table = TableSerializer()


class LinksMappingSerializer(
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
    serializers.Serializer
):
    serializers_mapping = {
        "o2o": OneToOneSerializer,
        "m2m": ManyToManySerializer
    }

    def get_mapping_field(self):
        return self.instance.link_type


class ConstraintSerializer(serializers.ModelSerializer):
    link_type = serializers.IntegerField()
    data = LinksMappingSerializer()
