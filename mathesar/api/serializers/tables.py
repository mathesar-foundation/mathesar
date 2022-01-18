from django.urls import reverse
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.columns import SimpleColumnSerializer
from mathesar.models import Table, DataFile


class TableSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    columns = SimpleColumnSerializer(many=True, required=False)
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


class TablePreviewSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    name = serializers.CharField(required=False)
    columns = SimpleColumnSerializer(many=True)
