from rest_framework import serializers

from db.types.base import db_types_hinted


class DBTypeSerializer(serializers.Serializer):
    id = serializers.CharField()
    hints = serializers.ListField(child=serializers.DictField())

    def to_representation(self, db_type):
        return {
            # TODO solve db type casing holistically
            # https://github.com/centerofci/mathesar/issues/1036
            "id": db_type.value.upper(),
            "hints": db_types_hinted.get(db_type, None),
        }
