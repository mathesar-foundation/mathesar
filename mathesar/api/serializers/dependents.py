from mathesar.api.serializers.shared_serializers import MathesarPolymorphicErrorMixin, ReadOnlyPolymorphicSerializerMappingMixin
from rest_framework import serializers

from mathesar.models.base import Constraint, Schema, Table


DATABASE_OBJECT_TYPES = [
    'table',
    'table column',
    'table constraint',
    'view',
    'index',
    'trigger',
    'sequence',
    'type',
    'function'
]


class DependentMathesarObjectSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    attnum = serializers.CharField(required=False)

    def _get_object_type(self, instance):
        return instance.get('type', None)

    # TODO: get ids of supported objects on a previous step in batches
    def to_representation(self, instance):
        object_oid = instance.get('objid', None)
        object_type = self._get_object_type(instance)
        object_id = 0

        if object_type == 'table' or object_type == 'table column':
            object_id = Table.objects.get(oid=object_oid).id
            if object_type == 'table column':
                instance['attnum'] = instance.get('objsubid', None)
        elif object_type == 'table constraint':
            object_id = Constraint.objects.get(oid=object_oid).id
        elif object_type == 'schema':
            object_id = Schema.objects.get(oid=object_oid).id

        instance['id'] = object_id
        return super().to_representation(instance)


class DependentNonMathesarObjectSerializer(serializers.Serializer):
    objid = serializers.CharField()
    type = serializers.CharField()
    name = serializers.CharField()


class BaseDependentObjectSerializer(
    ReadOnlyPolymorphicSerializerMappingMixin,
    MathesarPolymorphicErrorMixin,
    serializers.Serializer
):
    serializers_mapping = {
        'table': DependentMathesarObjectSerializer,
        'table constraint': DependentMathesarObjectSerializer,
        'schema': DependentMathesarObjectSerializer,
        'table column': DependentMathesarObjectSerializer
    }

    def create(self, validated_data):
        serializer = self.get_serializer_class(self.get_mapping_field(validated_data))
        return serializer.create(validated_data)

    def get_mapping_field(self, data):
        return data.get('type', None)


class DependentSerializer(serializers.Serializer):
    obj = BaseDependentObjectSerializer()
    parent_obj = BaseDependentObjectSerializer()
    level = serializers.IntegerField()


class DependentFilterSerializer(serializers.Serializer):
    exclude = serializers.MultipleChoiceField(DATABASE_OBJECT_TYPES, required=False)
