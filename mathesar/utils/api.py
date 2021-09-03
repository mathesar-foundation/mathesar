from mathesar.models import Table
from rest_framework.exceptions import NotFound


def get_table_or_404(queryset, pk):
    """
    Get table if exist, otherwise to throw an error of NotFound
    Args:
        queryset: QuerySet
        pk: id of table
    Returns:
        table: return the table based on a specific id
    """
    try:
        table = queryset.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table
