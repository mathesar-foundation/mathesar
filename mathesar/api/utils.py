from rest_framework.exceptions import NotFound

from mathesar.models import Table


def get_table_or_404(pk):
    """
    Get table if exist, otherwise to throw an error of NotFound
    Args:
        queryset: QuerySet
        pk: id of table
    Returns:
        table: return the table based on a specific id
    """
    try:
        table = Table.objects.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table
