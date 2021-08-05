import requests

from django.urls import reverse
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from mathesar.models import Table, Schema, DataFile, Database, Constraint


SUPPORTED_URL_CONTENT_TYPES = {'text/csv', 'text/plain'}


class ModelNameField(serializers.CharField):
    """
    De-serializes the request field as a string, but serializes the response field as
    `model.name`. Required to support passing and returing a model name from the
    endpoint, while also storing the model as a related field.
    """
    def to_representation(self, value):
        return value.name


class ArbitraryReturnCharField(serializers.CharField):
    """
    De-serializes the field as a string, but doesn't serialize the response field at
    all, and just returns what it is passed. Requires the property-to-be-serialized to
    always return a primitive data type.
    """
    def to_representation(self, value):
        return value


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
    database = ModelNameField(max_length=128)

    class Meta:
        model = Schema
        fields = ['id', 'name', 'tables', 'database', 'has_dependencies']


class SimpleColumnSerializer(serializers.Serializer):
    name = serializers.CharField()
    type = serializers.CharField()


class ColumnSerializer(SimpleColumnSerializer):
    index = serializers.IntegerField(source='column_index', read_only=True)
    nullable = serializers.BooleanField(default=True)
    primary_key = serializers.BooleanField(default=False)
    valid_target_types = serializers.ListField(read_only=True)
    default = ArbitraryReturnCharField(
        source='default_value', read_only=False, default=''
    )


class TableSerializer(serializers.ModelSerializer):
    columns = SimpleColumnSerializer(many=True, read_only=True, source='sa_columns')
    records_url = serializers.SerializerMethodField()
    constraints_url = serializers.SerializerMethodField()
    columns_url = serializers.SerializerMethodField()
    name = serializers.CharField(required=False, allow_blank=True, default='')
    data_files = serializers.PrimaryKeyRelatedField(
        required=False, many=True, queryset=DataFile.objects.all()
    )

    class Meta:
        model = Table
        fields = ['id', 'name', 'schema', 'created_at', 'updated_at',
                  'columns', 'records_url', 'constraints_url', 'columns_url', 'data_files', 'has_dependencies']

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


class DatabaseSerializer(serializers.ModelSerializer):
    supported_types = serializers.ListField(child=serializers.CharField())

    class Meta:
        model = Database
        fields = ['id', 'name', 'deleted', 'supported_types']
        read_only_fields = ['id', 'name', 'deleted', 'supported_types']


class DataFileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        default=serializers.CurrentUserDefault(), read_only=True
    )
    header = serializers.BooleanField(default=True)
    paste = serializers.CharField(required=False, trim_whitespace=False)
    url = serializers.URLField(required=False)

    class Meta:
        model = DataFile
        fields = [
            'id', 'file', 'table_imported_to', 'user', 'header', 'delimiter',
            'escapechar', 'quotechar', 'paste', 'url', 'created_from'
        ]
        extra_kwargs = {
            'file': {'required': False},
            'delimiter': {'trim_whitespace': False},
            'escapechar': {'trim_whitespace': False},
            'quotechar': {'trim_whitespace': False}
        }
        # We only currently support importing to a new table, so setting a table via API is invalid.
        # User should be set automatically, not submitted via the API.
        read_only_fields = ['user', 'table_imported_to', 'created_from']
        write_only_fields = ['paste', 'url']

    def save(self, **kwargs):
        """
        Set user to current user while saving the data file.
        """
        current_user = self.fields['user'].get_default()
        if current_user.is_authenticated:
            kwargs['user'] = current_user
        return super().save(**kwargs)

    def validate(self, data):
        if not self.partial:
            # Only perform validation on source files when we're not partial
            source_fields = ['file', 'paste', 'url']
            present_fields = [field for field in source_fields if field in data]
            if len(present_fields) > 1:
                raise ValidationError(
                    f'Multiple source fields passed: {present_fields}.'
                    f' Only one of {source_fields} should be specified.'
                )
            elif len(present_fields) == 0:
                raise ValidationError(
                    f'One of {source_fields} should be specified.'
                )
        return data

    def validate_url(self, url):
        try:
            response = requests.head(url, allow_redirects=True)
        except requests.exceptions.ConnectionError:
            raise ValidationError('URL cannot be reached.')

        content_type = response.headers.get('content-type')
        if content_type not in SUPPORTED_URL_CONTENT_TYPES:
            raise ValidationError(f"URL resource '{content_type}' not a valid type.")
        return url


class ConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.ListField()

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']
