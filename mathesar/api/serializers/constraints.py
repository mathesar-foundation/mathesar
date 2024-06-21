from psycopg.errors import DuplicateTable, UniqueViolation
from rest_framework import serializers, status

from db.constraints import utils as constraint_utils
from db.identifiers import is_identifier_too_long
from db.constraints.base import ForeignKeyConstraint, UniqueConstraint

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
from mathesar.api.exceptions.validation_exceptions.exceptions import (
    ConstraintColumnEmptyAPIException, UnsupportedConstraintAPIException,
    InvalidTableName
)
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models.deprecated import Column, Constraint, Table


class TableFilteredPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """
    Limits the accepted related primary key values to a specific table.
    For example, if the PrimaryKeyRelatedField is instantiated with a
    Column queryset, only columns in the "associated table" are
    accepted. The "associated table" is defined by the context dict's
    `table_id` value.
    """
    def get_queryset(self):
        table_id = self.context.get('table_id', None)
        queryset = super(TableFilteredPrimaryKeyRelatedField, self).get_queryset()
        if table_id is None or not queryset:
            return None
        return queryset.filter(table__id=table_id)


class BaseConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = TableFilteredPrimaryKeyRelatedField(queryset=Column.current_objects, many=True)

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']

    def construct_constraint_obj(self, table, data):
        columns_attnum = [column.attnum for column in data.get('columns')]
        if data.get('type') == constraint_utils.ConstraintType.UNIQUE.value:
            return UniqueConstraint(data.get('name', None), table.oid, columns_attnum)
        return None

    def create(self, validated_data):
        table = self.context['table']
        constraint_obj = self.construct_constraint_obj(table, validated_data)
        # Additional check is needed because we support read operations for primary key constraint,
        # but we don't support write operations
        if constraint_obj is None:
            constraint_type = validated_data.get('type', None)
            raise UnsupportedConstraintAPIException(constraint_type=constraint_type, field='type')
        try:
            constraint = table.add_constraint(constraint_obj)
        except DuplicateTable as e:
            raise database_api_exceptions.DuplicateTableAPIException(
                e,
                message='Relation with the same name already exists',
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except UniqueViolation as e:
            raise database_api_exceptions.UniqueViolationAPIException(
                e,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        return constraint

    def validate_name(self, name):
        if is_identifier_too_long(name):
            raise database_api_exceptions.IdentifierTooLong(field='name')
        return name


class ForeignKeyConstraintSerializer(BaseConstraintSerializer):
    class Meta:
        model = Constraint
        fields = BaseConstraintSerializer.Meta.fields + [
            'referent_columns',
            'referent_table',
            'onupdate',
            'ondelete',
            'deferrable',
            'match'
        ]

    referent_columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)
    referent_table = serializers.SerializerMethodField()
    onupdate = serializers.ChoiceField(
        choices=['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT'],
        required=False,
        allow_null=True
    )
    ondelete = serializers.ChoiceField(
        choices=['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT'],
        required=False,
        allow_null=True
    )
    deferrable = serializers.BooleanField(allow_null=True, required=False)
    match = serializers.ChoiceField(choices=['SIMPLE', 'PARTIAL', 'FULL'], allow_null=True, required=False)

    def get_referent_table(self, obj):
        return obj.referent_columns[0].table.id

    def construct_constraint_obj(self, table, data):
        columns_attnum = [column.attnum for column in data.get('columns')]
        referent_columns = data.get('referent_columns')
        referent_columns_attnum = [column.attnum for column in referent_columns]
        constraint_options_fields = ['onupdate', 'ondelete', 'deferrable']
        constraint_options = {
            constraint_options_field: data[constraint_options_field]
            for constraint_options_field in constraint_options_fields if constraint_options_field in data
        }
        return ForeignKeyConstraint(
            data.get('name', None),
            table.oid,
            columns_attnum,
            referent_columns[0].table.oid,
            referent_columns_attnum,
            constraint_options
        )


class ConstraintSerializer(
    ReadWritePolymorphicSerializerMappingMixin,
    MathesarPolymorphicErrorMixin,
    serializers.ModelSerializer
):
    class Meta:
        model = Constraint
        fields = '__all__'

    serializers_mapping = {
        'foreignkey': ForeignKeyConstraintSerializer,
        'primary': BaseConstraintSerializer,
        'unique': BaseConstraintSerializer,
        # Even though 'check' & 'exclude' constraints are currently unsupported it's added here
        # so that the app doesn't break in case these constraints are already present.
        'check': BaseConstraintSerializer,
        'exclude': BaseConstraintSerializer
    }

    def get_mapping_field(self, data):
        if isinstance(data, Constraint):
            constraint_type = data.type
        else:
            constraint_type = data.get('type', None)
        assert constraint_type is not None
        return constraint_type

    def create(self, validated_data):
        serializer = self.get_serializer_class(self.get_mapping_field(validated_data))
        return serializer.create(validated_data)

    def run_validation(self, data):
        if referent_table := data.get('referent_table', None):
            referent_table_name = Table.current_objects.get(id=referent_table).name
            if any(
                invalid_char in referent_table_name
                for invalid_char in ('(', ')')
            ):
                raise InvalidTableName(
                    referent_table_name,
                    field='referent_table'
                )
        constraint_type = data.get('type', None)
        if constraint_type not in ('foreignkey', 'primary', 'unique'):
            raise UnsupportedConstraintAPIException(constraint_type=constraint_type)
        columns = data.get('columns', None)
        if columns == []:
            raise ConstraintColumnEmptyAPIException(field='columns')
        return super(ConstraintSerializer, self).run_validation(data)
