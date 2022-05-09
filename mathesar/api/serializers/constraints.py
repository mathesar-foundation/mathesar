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
    class Meta:
        model = Constraint
        fields = BaseConstraintSerializer.Meta.fields + ['referent_columns']

    referent_columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)


class ConstraintSerializer(ReadWritePolymorphicSerializerMappingMixin, MathesarPolymorphicErrorMixin, serializers.ModelSerializer):
    class Meta:
        model = Constraint
        fields = '__all__'
    serializers_mapping = {
        'foreignkey': ForeignKeyConstraintSerializer,
        'primary': BaseConstraintSerializer,
        'unique': BaseConstraintSerializer,
    }

    def get_mapping_field(self, data):
        if isinstance(data, Constraint):
            constraint_type = data.type
        else:
            constraint_type = data.get('type', None)
        return constraint_type
