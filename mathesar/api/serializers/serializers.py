from django.urls import reverse
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from mathesar.api.serializers.columns import SimpleColumnSerializer
from mathesar.models import Table, Schema, DataFile


class ModelNameField(serializers.CharField):
    """
    De-serializes the request field as a string, but serializes the response field as
    `model.name`. Required to support passing and returing a model name from the
    endpoint, while also storing the model as a related field.
    """
    def to_representation(self, value):
        return value.name


class SchemaSerializer(serializers.HyperlinkedModelSerializer):
    name = serializers.CharField()
    database = ModelNameField(max_length=128)

    class Meta:
        model = Schema
        fields = ['id', 'name', 'database', 'has_dependencies']


class TableSerializer(serializers.ModelSerializer):
    columns = SimpleColumnSerializer(many=True, source='sa_columns', required=False)
    records_url = serializers.SerializerMethodField()
    constraints_url = serializers.SerializerMethodField()
    columns_url = serializers.SerializerMethodField()
    type_suggestions_url = serializers.SerializerMethodField()
    previews_url = serializers.SerializerMethodField()
    name = serializers.CharField(required=False, allow_blank=True, default='')
    data_files = serializers.PrimaryKeyRelatedField(
        required=False, many=True, queryset=DataFile.objects.all()
    )

    class Meta:
        model = Table
        fields = ['id', 'name', 'schema', 'created_at', 'updated_at', 'import_verified',
                  'columns', 'records_url', 'constraints_url', 'columns_url',
                  'type_suggestions_url', 'previews_url', 'data_files',
                  'has_dependencies']

    def get_records_url(self, obj):
        if isinstance(obj, Table):
            # Only get records if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-record-list', kwargs={'table_pk': obj.pk}))
        else:
            return None

    def get_constraints_url(self, obj):
        if isinstance(obj, Table):
            # Only get constraints if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-constraint-list', kwargs={'table_pk': obj.pk}))
        else:
            return None

    def get_columns_url(self, obj):
        if isinstance(obj, Table):
            # Only get columns if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-column-list', kwargs={'table_pk': obj.pk}))
        else:
            return None

    def get_type_suggestions_url(self, obj):
        if isinstance(obj, Table):
            # Only get type suggestions if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-type-suggestions', kwargs={'pk': obj.pk}))
        else:
            return None

    def get_previews_url(self, obj):
        if isinstance(obj, Table):
            # Only get previews if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-previews', kwargs={'pk': obj.pk}))
        else:
            return None

    def validate_data_files(self, data_files):
        if data_files and len(data_files) > 1:
            raise ValidationError('Multiple data files are unsupported.')
        return data_files


class RecordSerializer(serializers.BaseSerializer):
    def to_representation(self, instance):
        return instance._asdict()


class TablePreviewSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    columns = SimpleColumnSerializer(many=True)


class RecordListParameterSerializer(serializers.Serializer):
    filters = serializers.JSONField(required=False, default=[])
    order_by = serializers.JSONField(required=False, default=[])
    group_count_by = serializers.JSONField(required=False, default=[])
