from psycopg2.errors import DuplicateTable, UniqueViolation
from rest_framework import serializers, status
from sqlalchemy.exc import IntegrityError, ProgrammingError
from db.constraints import utils as constraint_utils

import mathesar.api.exceptions.database_exceptions.exceptions as database_api_exceptions
import mathesar.api.exceptions.generic_exceptions.base_exceptions as base_api_exceptions
from db.constraints.base import ForeignKeyConstraint, UniqueConstraint
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models import Column, Constraint


class BaseConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)

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
        if constraint_obj is None:
            raise ValueError('Only creating unique constraints is currently supported.')
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
            'onupdate',
            'ondelete',
            'deferrable',
            'match'
        ]

    referent_columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)
    onupdate = serializers.ChoiceField(choices=['CASCADE', 'DELETE', 'RESTRICT'])
    ondelete = serializers.ChoiceField(choices=['CASCADE', 'DELETE', 'RESTRICT'])
    deferrable = serializers.BooleanField()
    match = serializers.ChoiceField(choices=['SIMPLE', 'PARTIAL', 'FULL'])

    def construct_constraint_obj(self, table, data):
        columns_attnum = [column.attnum for column in data.get('columns')]
        referent_columns = data.get('referent_columns')
        referent_columns_attnum = [column.attnum for column in referent_columns]
        return ForeignKeyConstraint(
            data.get('name', None),
            table.oid,
            columns_attnum,
            referent_columns[0].table.oid,
            referent_columns_attnum
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

    def create(self, validated_data):
        serializer = self.serializers_mapping.get(self.get_mapping_field(validated_data))
        return serializer.create(validated_data)

    def get_mapping_field(self, data):
        if isinstance(data, Constraint):
            constraint_type = data.type
        else:
            constraint_type = data.get('type', None)
        return constraint_type
