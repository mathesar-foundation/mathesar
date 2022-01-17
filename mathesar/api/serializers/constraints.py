from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models import Constraint


class ConstraintSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.ListField()

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']
