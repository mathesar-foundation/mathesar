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
    column_name = serializers.CharField()
    reference_table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())
    referent_table = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all())

    def is_link_unique(self):
        return True

    def create(self, validated_data):
        reference_table: Table = validated_data['reference_table']
        create_foreign_key_link(
            reference_table.schema._sa_engine,
            reference_table._sa_table.schema,
            validated_data.get('column_name'),
            reference_table.oid,
            validated_data.get('referent_table').oid,
            unique_link=self.is_link_unique()
        )
        return validated_data


class OneToManySerializer(OneToOneSerializer):

    def is_link_unique(self):
        return False


class ManyToManySerializer(MathesarErrorMessageMixin, serializers.Serializer):
    referent_tables = serializers.PrimaryKeyRelatedField(queryset=Table.objects.all(), many=True)
    map_table_name = serializers.CharField()

    def create(self, validated_data):
        referent_tables = validated_data['referent_tables']
        referent_tables_oid = [table.oid for table in validated_data['referent_tables']]
        create_many_to_many_link(
            referent_tables[0].schema._sa_engine,
            referent_tables[0]._sa_table.schema,
            validated_data.get('map_table_name'),
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
        "o2o": OneToOneSerializer,
        "o2m": OneToManySerializer,
        "m2m": ManyToManySerializer
    }
    link_type = serializers.CharField(required=True)

    def get_mapping_field(self):
        link_type = self.initial_data.get('link_type', None)
        if link_type is None:
            raise ColumnSizeMismatchAPIException()
        return link_type
