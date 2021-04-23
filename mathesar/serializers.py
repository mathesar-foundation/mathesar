from rest_framework import serializers

from mathesar.models import Table, Schema


class ColumnSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()


class SchemaSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Schema
        fields = ['id', 'name', 'database', 'tables']


class TableSerializer(serializers.HyperlinkedModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True, source='sa_columns')

    class Meta:
        model = Table
        fields = ['id', 'name', 'schema', 'created_at', 'updated_at', 'columns']
