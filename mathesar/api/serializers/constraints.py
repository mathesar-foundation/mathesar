from rest_framework import serializers

from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models import Constraint, Column


class BaseConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']


class ForeignKeyConstraintSerializer(BaseConstraintSerializer):
    referent_columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)


class ConstraintSerializer(ReadWritePolymorphicSerializerMappingMixin, MathesarPolymorphicErrorMixin, serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)

    class Meta:
        model = Constraint
        fields = '__all__'
    serializers_mapping = {
        'unique': BaseConstraintSerializer,
        'foreignkey': ForeignKeyConstraintSerializer,
    }

    def get_mapping_field(self):
        return self.instance.type
