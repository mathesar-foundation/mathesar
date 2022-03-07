from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin


class RecordListParameterSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    filter = serializers.JSONField(required=False, default=None)
    db_function = serializers.JSONField(required=False, default=None)
    deduplicate = serializers.JSONField(required=False, default=False)
    order_by = serializers.JSONField(required=False, default=[])
    grouping = serializers.JSONField(required=False, default={})
    duplicate_only = serializers.JSONField(required=False, default=None)


class RecordSerializer(MathesarErrorMessageMixin, serializers.BaseSerializer):
    def to_representation(self, instance):
        return instance._asdict() if not isinstance(instance, dict) else instance
