from django import forms
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.encoding import force_str
from django.views.decorators.http import require_POST

from mathesar.imports.datafile import insert_into_existing_table
from mathesar.utils.datafiles import create_datafile
from mathesar.rpc.utils import connect


class BulkInsertForm(forms.Form):
    file = forms.FileField(required=True)
    database_id = forms.IntegerField(required=True)
    target_table_oid = forms.IntegerField(required=True)
    mappings = forms.JSONField(required=True)
    header = forms.BooleanField(required=False)


@require_POST
@login_required
def bulk_insert(request):
    """
    A view to allow inserting data into existing tables.
    """
    user = request.user
    form = BulkInsertForm(request.POST, request.FILES)
    if form.is_valid():
        data = form.cleaned_data
        database_id = data["database_id"]
        target_table_oid = data["target_table_oid"]
        mappings = data["mappings"]
        try:
            datafile = create_datafile(data, user)
            with connect(database_id, user) as conn:
                inserted_rows = insert_into_existing_table(user, datafile.id, target_table_oid, mappings, conn)
                return JsonResponse({"inserted_rows": inserted_rows})
        except Exception as e:
            return JsonResponse({"errors": "Unable to import data into existing table. " + force_str(e)}, status=400)
    else:
        return JsonResponse({'errors': form.errors}, status=400)
