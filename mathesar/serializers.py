from rest_framework import serializers

from mathesar.models import Table


class ColumnSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()


class TableSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True, source='sa_columns')

    class Meta:
        model = Table
        fields = ['id', 'name', 'schema', 'created_at', 'updated_at', 'columns']
