from rest_access_policy import PermittedPkRelatedField
from rest_framework import serializers

from db.links.operations.create import create_foreign_key_link, create_many_to_many_link
from mathesar.api.db.permissions.table import TableAccessPolicy
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.exceptions.validation_exceptions.exceptions import (
    InvalidLinkChoiceAPIException, InvalidTableName
)
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models.base import Table


class OneToOneSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    reference_column_name = serializers.CharField()
    reference_table = PermittedPkRelatedField(access_policy=TableAccessPolicy, queryset=Table.current_objects.all())
    referent_table = PermittedPkRelatedField(access_policy=TableAccessPolicy, queryset=Table.current_objects.all())
    # TODO Fix hacky link_type detection by reflecting it correctly
    link_type = serializers.CharField(default="one-to-one")

    def is_link_unique(self):
        return True

    def validate(self, attrs):
        if referent_table := attrs.get('referent_table', None):
            referent_table_name = referent_table.name
            if any(
                invalid_char in referent_table_name
                for invalid_char in ('(', ')')
            ):
                raise InvalidTableName(
                    referent_table_name,
                    field='referent_table'
                )
        return super(OneToOneSerializer, self).validate(attrs)

    def create(self, validated_data):
        reference_table = validated_data['reference_table']
        create_foreign_key_link(
            reference_table.schema._sa_engine,
            reference_table._sa_table.schema,
            validated_data.get('reference_column_name'),
            reference_table.oid,
            validated_data.get('referent_table').oid,
            unique_link=self.is_link_unique()
        )
        return validated_data


class OneToManySerializer(OneToOneSerializer):
    link_type = serializers.CharField(default="one-to-many")

    def is_link_unique(self):
        return False


class MapColumnSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    column_name = serializers.CharField()
    referent_table = PermittedPkRelatedField(access_policy=TableAccessPolicy, queryset=Table.current_objects.all())


class ManyToManySerializer(MathesarErrorMessageMixin, serializers.Serializer):
    referents = MapColumnSerializer(many=True)
    mapping_table_name = serializers.CharField()
    link_type = serializers.CharField(default="many-to-many")

    def validate(self, attrs):
        if referents := attrs.get('referents', None):
            referent_tables = (
                referent_table.get('referent_table').name
                for referent_table in referents
            )
            for referent_table_name in referent_tables:
                if any(
                    invalid_char in referent_table_name
                    for invalid_char in ('(', ')')
                ):
                    raise InvalidTableName(
                        referent_table_name,
                        field='referents'
                    )
        return super(ManyToManySerializer, self).validate(attrs)

    def create(self, validated_data):
        referents = validated_data['referents']
        referent_tables_oid = [
            {'referent_table': map_table_obj['referent_table'].oid, 'column_name': map_table_obj['column_name']} for
            map_table_obj in validated_data['referents']]
        create_many_to_many_link(
            referents[0]['referent_table'].schema._sa_engine,
            referents[0]['referent_table']._sa_table.schema,
            validated_data.get('mapping_table_name'),
            referent_tables_oid,
        )
        return validated_data


class LinksMappingSerializer(
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
    serializers.Serializer
):
    def create(self, validated_data):
        serializer = self.serializers_mapping.get(self.get_mapping_field(validated_data))
        return serializer.create(validated_data)

    serializers_mapping = {
        "one-to-one": OneToOneSerializer,
        "one-to-many": OneToManySerializer,
        "many-to-many": ManyToManySerializer
    }
    link_type = serializers.CharField(required=True)


    def get_mapping_field(self, data):
        link_type = data.get('link_type', None)
        if link_type is None:
            raise InvalidLinkChoiceAPIException()
        return link_type
