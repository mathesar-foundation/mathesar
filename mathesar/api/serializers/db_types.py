from rest_framework import serializers

from db.types.base import db_types_hinted


class DBTypeSerializer(serializers.Serializer):
    id = serializers.CharField()
    hints = serializers.ListField(child=serializers.DictField())

    def to_representation(self, db_type):
        return {
            "id": db_type.value,
            "hints": db_types_hinted.get(db_type, None),
        }
