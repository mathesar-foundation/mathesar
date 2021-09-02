from rest_framework import serializers

from mathesar.models import Constraint


class ConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.ListField()

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']
