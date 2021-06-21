from django.urls import reverse
from rest_framework import serializers

from mathesar.models import Table, Schema, DataFile


class NestedTableSerializer(serializers.HyperlinkedModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ['id', 'name', 'url']

    def get_url(self, obj):
        request = self.context['request']
        return request.build_absolute_uri(reverse('table-detail', kwargs={'pk': obj.pk}))


class SchemaSerializer(serializers.HyperlinkedModelSerializer):
    tables = NestedTableSerializer(many=True, read_only=True)
    name = serializers.CharField()

    class Meta:
        model = Schema
        fields = ['id', 'name', 'database', 'tables']


class ColumnSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()


class TableSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True, source='sa_columns')
    records = serializers.SerializerMethodField()
    name = serializers.CharField()

    class Meta:
        model = Table
        fields = ['id', 'name', 'schema', 'created_at', 'updated_at',
                  'columns', 'records', 'data_files']

    def get_records(self, obj):
        if isinstance(obj, Table):
            # Only get records if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-records-list', kwargs={'table_pk': obj.pk}))
        else:
            return None


class RecordSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return instance._asdict()


class DataFileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        default=serializers.CurrentUserDefault(), read_only=True
    )

    class Meta:
        model = DataFile
        fields = ['id', 'file', 'table_imported_to', 'user', 'delimiter', 'escapechar',
                  'quotechar']
        extra_kwargs = {'delimiter': {'trim_whitespace': False},
                        'escapechar': {'trim_whitespace': False},
                        'quotechar': {'trim_whitespace': False}}
        # We only currently support importing to a new table, so setting a table via API is invalid.
        # User should be set automatically, not submitted via the API.
        read_only_fields = ['table_imported_to']

    def save(self, **kwargs):
        """
        Set user to current user while saving the data file.
        """
        current_user = self.fields['user'].get_default()
        if current_user.is_authenticated:
            kwargs['user'] = current_user
        return super().save(**kwargs)
