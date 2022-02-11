from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin


class RecordListParameterSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    filters = serializers.JSONField(required=False, default=[])
    order_by = serializers.JSONField(required=False, default=[])
    grouping = serializers.JSONField(required=False, default={})


class RecordSerializer(MathesarErrorMessageMixin, serializers.BaseSerializer):
    def to_representation(self, instance):
        records = instance._asdict() if not isinstance(instance, dict) else instance
        columns_map = self.context['columns_map']
        records = {columns_map[column_name]: column_value for column_name, column_value in records.items()}
        return records
