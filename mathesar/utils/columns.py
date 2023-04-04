from mathesar.models.base import Column, Constraint
from mathesar.api.serializers.constraints import ConstraintSerializer


def uniqueness_constraint_column(column_id, table):
    constraints = Constraint.objects.filter(table=table)
    for constraint in constraints:
        constraint_serializer_data = ConstraintSerializer(constraint).data
        if column_id in constraint_serializer_data['columns'] and constraint_serializer_data['type'] == 'unique':
            return True
    return False
