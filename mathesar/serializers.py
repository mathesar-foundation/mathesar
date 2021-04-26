from django.urls import reverse
from rest_framework import serializers

from mathesar.models import Table, Schema


class ColumnSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()


class RecordSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return instance._asdict()


class SchemaSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Schema
        fields = ['id', 'name', 'database', 'tables']


class TableSerializer(serializers.HyperlinkedModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True, source='sa_columns')
    records = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ['id', 'name', 'schema', 'created_at', 'updated_at', 'columns', 'records']

    def get_records(self, obj):
        request = self.context['request']
        return request.build_absolute_uri(reverse('table-records-list', kwargs={'table_pk': obj.pk}))
