from rest_framework import serializers

from db.types.base import db_types_hinted


class DBTypeSerializer(serializers.Serializer):
    id = serializers.CharField()
    hints = serializers.ListField(child=serializers.DictField())

    def to_representation(self, db_type):
        # TODO solve db type casing holistically
        # https://github.com/centerofci/mathesar/issues/1036
        uppercase_id = db_type.value.upper()
        uppercased_aliases = [db_type_id.upper() for db_type_id in db_type.aliases]
        uppercased_alias_of = db_type.alias_of.upper() if db_type.alias_of else None
        return {
            "id": uppercase_id,
            "aliases": uppercased_aliases,
            "alias_of": uppercased_alias_of,
            "hints": db_types_hinted.get(db_type, None),
        }
