from rest_framework import serializers

from db.types.hintsets import db_types_hinted


class DBTypeSerializer(serializers.Serializer):
    id = serializers.CharField()
    hints = serializers.ListField(child=serializers.DictField())

    def to_representation(self, db_type):
        # TODO solve db type casing holistically
        # https://github.com/centerofci/mathesar/issues/1036
        uppercase_id = db_type.id.upper()
        return {
            "id": uppercase_id,
            "hints": db_types_hinted.get(db_type, None),
        }
