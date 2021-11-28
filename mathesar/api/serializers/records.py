from rest_framework import serializers


class RecordListParameterSerializer(serializers.Serializer):
    filters = serializers.JSONField(required=False, default=None)
    order_by = serializers.JSONField(required=False, default=[])
    group_count_by = serializers.JSONField(required=False, default=[])


class RecordSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return instance._asdict()
