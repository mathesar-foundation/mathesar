from django.urls import reverse
from psycopg2.errors import DuplicateTable
from rest_framework import serializers, status
from sqlalchemy.exc import ProgrammingError

from db.types.base import get_db_type_enum_from_id

from mathesar.api.exceptions.validation_exceptions.exceptions import (
    ColumnSizeMismatchAPIException, DistinctColumnRequiredAPIException,
    MultipleDataFileAPIException, UnknownDatabaseTypeIdentifier
)
from mathesar.api.exceptions.database_exceptions.exceptions import DuplicateTableAPIException
from mathesar.api.exceptions.database_exceptions.base_exceptions import ProgrammingAPIException
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.columns import SimpleColumnSerializer
from mathesar.models import Table, DataFile
from mathesar.utils.tables import gen_table_name, create_table_from_datafile, create_empty_table


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
            raise MultipleDataFileAPIException()
        return data_files

    def create(self, validated_data):
        schema = validated_data['schema']
        data_files = validated_data.get('data_files')
        name = validated_data.get('name') or gen_table_name(schema, data_files)

        try:
            if data_files:
                table = create_table_from_datafile(data_files, name, schema)
            else:
                table = create_empty_table(name, schema)
        except ProgrammingError as e:
            if type(e.orig) == DuplicateTable:
                raise DuplicateTableAPIException(
                    e,
                    message=f"Relation {validated_data['name']} already exists in schema {schema.id}",
                    field="name",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise ProgrammingAPIException(e)
        return table


class TablePreviewSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    name = serializers.CharField(required=False)
    columns = SimpleColumnSerializer(many=True)

    def validate_columns(self, columns):
        table = self.context['table']
        column_names = [col["name"] for col in columns]
        if not len(column_names) == len(set(column_names)):
            raise DistinctColumnRequiredAPIException()
        if not len(columns) == len(table.sa_columns):
            raise ColumnSizeMismatchAPIException()
        for column in columns:
            db_type_id = column['type']
            db_type = get_db_type_enum_from_id(db_type_id)
            if db_type is None:
                raise UnknownDatabaseTypeIdentifier(db_type_id=db_type_id)
        return columns
