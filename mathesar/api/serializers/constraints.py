from psycopg2.errors import DuplicateTable, UniqueViolation
from rest_framework import serializers, status
from sqlalchemy.exc import IntegrityError, ProgrammingError
from db.constraints import utils as constraint_utils

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
import mathesar.api.exceptions.generic_exceptions.base_exceptions as base_api_exceptions
from mathesar.api.exceptions.validation_exceptions.exceptions import (
    ConstraintColumnEmptyAPIException, UnsupportedConstraintAPIException,
)
from db.constraints.base import ForeignKeyConstraint, UniqueConstraint
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models.base import Column, Constraint


class Table_Filtered_Column_queryset(serializers.PrimaryKeyRelatedField):
    def get_queryset(self):
        table_id = self.context.get('table_id', None)
        queryset = super(Table_Filtered_Column_queryset, self).get_queryset()
        if table_id is None or not queryset:
            return None
        return queryset.filter(table__id=table_id)


class BaseConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = Table_Filtered_Column_queryset(queryset=Column.current_objects, many=True)

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
        except ProgrammingError as e:
            if type(e.orig) == DuplicateTable:
                raise database_api_exceptions.DuplicateTableAPIException(
                    e,
                    message='Relation with the same name already exists',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise base_api_exceptions.MathesarAPIException(e)
        except IntegrityError as e:
            if type(e.orig) == UniqueViolation:
                raise database_api_exceptions.UniqueViolationAPIException(
                    e,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            else:
                raise base_api_exceptions.MathesarAPIException(e)
        return constraint


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
    }

    def get_mapping_field(self, data):
        if isinstance(data, Constraint):
            constraint_type = data.type
        else:
            constraint_type = data.get('type', None)
        return constraint_type

    def run_validation(self, data):
        constraint_type = data.get('type', None)
        if constraint_type not in self.serializers_mapping.keys():
            raise UnsupportedConstraintAPIException(constraint_type=constraint_type)
        columns = data.get('columns', None)
        if columns == []:
            raise ConstraintColumnEmptyAPIException(field='columns')
        return super(ConstraintSerializer, self).run_validation(data)
