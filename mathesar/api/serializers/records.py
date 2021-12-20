from rest_framework import serializers


class RecordListParameterSerializer(serializers.Serializer):
    filters = serializers.JSONField(required=False, default=None)
    order_by = serializers.JSONField(required=False, default=[])
    duplicate_only = serializers.JSONField(required=False, default=None)
    grouping = serializers.JSONField(required=False, default={})

    def validate_duplicate_only(self, duplicate_only):
        is_none = duplicate_only is None
        if not is_none:
            is_a_list = type(duplicate_only) is list
            if not is_a_list:
                raise serializers.ValidationError("duplicate_only must be a list.")
            is_a_list_of_strings = all(
                (type(column_name) is str for column_name in duplicate_only)
            )
            if not is_a_list_of_strings:
                raise serializers.ValidationError("duplicate_only must be a list of column name strings.")
        return duplicate_only


class RecordSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return instance._asdict() if not isinstance(instance, dict) else instance
