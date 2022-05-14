from rest_framework import status
from rest_framework import serializers
from mathesar.api.exceptions.generic_exceptions import base_exceptions as base_api_exceptions
from mathesar.api.serializers.shared_serializers import (
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
)
from mathesar.models import Constraint, Column


class BaseConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']

    def run_validation(self, data):
        table_id = self.context['table_id']
        for col_id in dict(data)['columns']:
            try:
                column = Column.current_objects.filter(table__id=table_id).get(id=col_id)
            except Column.DoesNotExist:
                message = "Column does not exist"
                raise base_api_exceptions.NotFoundAPIException(ValueError, message=message, status_code=status.HTTP_400_BAD_REQUEST)
        return super(ConstraintSerializer, self).run_validation(data)


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
