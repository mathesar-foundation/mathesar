from rest_framework.exceptions import NotFound

from mathesar.models import Table


def get_table_or_404(pk):
    try:
        table = Table.objects.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table
