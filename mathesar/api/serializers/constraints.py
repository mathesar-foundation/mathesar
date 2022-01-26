from rest_framework import serializers

from mathesar.models import Constraint, Column


class ConstraintSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    type = serializers.CharField()
    columns = serializers.PrimaryKeyRelatedField(queryset=Column.objects.all(), many=True)

    class Meta:
        model = Constraint
        fields = ['id', 'name', 'type', 'columns']
