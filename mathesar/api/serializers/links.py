from rest_framework import serializers

from db.links.operations.create import create_foreign_key_link, create_many_to_many_link
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.exceptions.validation_exceptions.exceptions import ColumnSizeMismatchAPIException
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models import Table


class OneToOneSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    referent_column_name = serializers.CharField()
    reference_table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    referent_table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())

    def is_link_unique(self):
        return True

    def create(self, validated_data):
        reference_table = validated_data['reference_table']
        create_foreign_key_link(
            reference_table.schema._sa_engine,
            reference_table._sa_table.schema,
            validated_data.get('referent_column_name'),
            reference_table.oid,
            validated_data.get('referent_table').oid,
            unique_link=self.is_link_unique()
        )
        return validated_data


class OneToManySerializer(OneToOneSerializer):

    def is_link_unique(self):
        return False


class MapColumnSerializer(serializers.Serializer):
    column_name = serializers.CharField()
    referent_table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())


class ManyToManySerializer(MathesarErrorMessageMixin, serializers.Serializer):
    referents = MapColumnSerializer(many=True)
    mapping_table_name = serializers.CharField()

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
        serializer = self.serializers_mapping.get(self.get_mapping_field())
        return serializer.create(validated_data)

    serializers_mapping = {
        "one-to-one": OneToOneSerializer,
        "one-to-many": OneToManySerializer,
        "many-to-many": ManyToManySerializer
    }
    link_type = serializers.CharField(required=True)

    def get_mapping_field(self):
        link_type = self.initial_data.get('link_type', None)
        if link_type is None:
            raise ColumnSizeMismatchAPIException()
        return link_type
