from rest_framework import status
from rest_framework import serializers
from mathesar.api.exceptions.generic_exceptions import base_exceptions as base_api_exceptions
from mathesar.models import Constraint, Column


class ConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), many=True)

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']

    def run_validation(self, data):
        for col_id in dict(data)['columns']:
            try:
                column = Column.current_objects.get(id=col_id)
            except Column.DoesNotExist:
                message = "Column does not exist"
                raise base_api_exceptions.NotFoundAPIException(ValueError, message=message, status_code=status.HTTP_400_BAD_REQUEST)
        return super(ConstraintSerializer, self).run_validation(data)
