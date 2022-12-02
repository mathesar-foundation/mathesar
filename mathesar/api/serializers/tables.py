from django.urls import reverse
from rest_access_policy import PermittedPkRelatedField
from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from sqlalchemy.exc import ProgrammingError

from db.types.operations.convert import get_db_type_enum_from_id
from db.tables.operations.create import DuplicateTable
from db.columns.exceptions import InvalidTypeError
from mathesar.api.db.permissions.schema import SchemaAccessPolicy
from mathesar.api.db.permissions.table import TableAccessPolicy

from mathesar.api.exceptions.validation_exceptions.exceptions import (
    ColumnSizeMismatchAPIException, DistinctColumnRequiredAPIException,
    MultipleDataFileAPIException, UnknownDatabaseTypeIdentifier,
)
from mathesar.api.exceptions.database_exceptions.exceptions import DuplicateTableAPIException, InvalidTypeCastAPIException
from mathesar.api.exceptions.database_exceptions.base_exceptions import ProgrammingAPIException
from mathesar.api.exceptions.validation_exceptions import base_exceptions as base_validation_exceptions
from mathesar.api.exceptions.generic_exceptions import base_exceptions as base_api_exceptions
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.columns import SimpleColumnSerializer
from mathesar.api.serializers.table_settings import TableSettingsSerializer
from mathesar.models.base import Column, Schema, Table, DataFile
from mathesar.utils.tables import gen_table_name, create_table_from_datafile, create_empty_table


class TableSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    columns = SimpleColumnSerializer(many=True, required=False)
    settings = TableSettingsSerializer(read_only=True)
    records_url = serializers.SerializerMethodField()
    constraints_url = serializers.SerializerMethodField()
    columns_url = serializers.SerializerMethodField()
    joinable_tables_url = serializers.SerializerMethodField()
    type_suggestions_url = serializers.SerializerMethodField()
    previews_url = serializers.SerializerMethodField()
    dependents_url = serializers.SerializerMethodField()
    name = serializers.CharField(required=False, allow_blank=True, default='')
    display_options = serializers.DictField(required=False)
    import_target = serializers.PrimaryKeyRelatedField(
        required=False, allow_null=True, queryset=Table.current_objects.all()
    )
    data_files = serializers.PrimaryKeyRelatedField(
        required=False, many=True, queryset=DataFile.objects.all()
    )
    description = serializers.CharField(
        required=False, allow_blank=True, default=None, allow_null=True
    )
    schema = PermittedPkRelatedField(
        access_policy=SchemaAccessPolicy,
        queryset=Schema.current_objects.all()
    )

    class Meta:
        model = Table
        fields = [
            'id', 'name', 'import_target', 'schema', 'created_at', 'updated_at',
            'import_verified', 'columns', 'records_url', 'constraints_url',
            'columns_url', 'joinable_tables_url', 'type_suggestions_url',
            'previews_url', 'data_files', 'has_dependents', 'dependents_url',
            'settings', 'description', 'display_options'
        ]

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

    def get_joinable_tables_url(self, obj):
        if isinstance(obj, Table):
            # Only get type suggestions if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-joinable-tables', kwargs={'pk': obj.pk}))
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

    def get_dependents_url(self, obj):
        if isinstance(obj, Table):
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-dependents', kwargs={'pk': obj.pk}))
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
        import_target = validated_data.get('import_target', None)
        description = validated_data.get('description')

        try:
            if data_files:
                table = create_table_from_datafile(
                    data_files, name, schema, comment=description
                )
                if import_target:
                    table.import_target = import_target
                    table.is_temp = True
                    table.save()
            else:
                table = create_empty_table(name, schema, comment=description)
        except DuplicateTable as e:
            raise DuplicateTableAPIException(
                e,
                message=f"Relation {validated_data['name']} already exists in schema {schema.id}",
                field="name",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except ProgrammingError as e:
            raise ProgrammingAPIException(e)
        return table

    def update(self, instance, validated_data):
        if self.partial:
            # Save the fields that are stored in the model.
            present_model_fields = []
            for model_field in instance.MODEL_FIELDS:
                if model_field in validated_data:
                    setattr(instance, model_field, validated_data[model_field])
                    present_model_fields.append(model_field)
            instance.save(update_fields=present_model_fields)
            for key in present_model_fields:
                del validated_data[key]
            # Save the fields that are stored in the underlying DB.
            try:
                instance.update_sa_table(validated_data)
            except InvalidTypeError as e:
                raise InvalidTypeCastAPIException(
                    e,
                    message=f'{e.column_name} cannot be casted to {e.new_type}.'
                    if e.column_name and e.new_type
                    else 'This type casting is invalid.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            except ValueError as e:
                raise base_api_exceptions.ValueAPIException(e, status_code=status.HTTP_400_BAD_REQUEST)
        return instance

    def validate(self, data):
        if self.partial:
            columns = data.get('columns', None)
            if columns is not None:
                for col in columns:
                    id = col.get('id', None)
                    if id is None:
                        message = "'id' field is required while batch updating columns."
                        raise base_validation_exceptions.MathesarValidationException(ValidationError, message=message)
        return data


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


class MoveTableRequestSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    move_columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)
    target_table = PermittedPkRelatedField(access_policy=TableAccessPolicy, queryset=Table.current_objects.all())


class SplitTableRequestSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    extract_columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)
    extracted_table_name = serializers.CharField()
    relationship_fk_column_name = serializers.CharField(allow_blank=False, allow_null=True, default=None)


class SplitTableResponseSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    extracted_table = serializers.PrimaryKeyRelatedField(queryset=Table.current_objects.all())
    remainder_table = serializers.PrimaryKeyRelatedField(queryset=Table.current_objects.all())


class MappingSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    def to_internal_value(self, data):
        from_col = Column.current_objects.get(id=data[0])
        target_col = Column.current_objects.get(id=data[1])
        return [from_col, target_col]


class TableImportSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    import_target = PermittedPkRelatedField(access_policy=TableAccessPolicy, queryset=Table.current_objects.all(), required=True)
    data_files = serializers.PrimaryKeyRelatedField(required=True, many=True, queryset=DataFile.objects.all())
    mappings = MappingSerializer(required=True, allow_null=True, many=True)
