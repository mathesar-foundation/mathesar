from django.http import JsonResponse
from django.shortcuts import render

from mathesar.forms.forms import UploadFileForm
from mathesar.imports.csv import legacy_create_table_from_csv
from mathesar.models import Schema
from mathesar.serializers import SchemaSerializer
from mathesar.database.utils import get_non_default_database_keys


def get_common_data(request):
    schema_serializer = SchemaSerializer(Schema.objects.all(), many=True, context={'request': request})
    return {
        "schemas": schema_serializer.data,
        "databases": get_non_default_database_keys(),
    }


def index(request, **kwargs):
    # TODO: Remove this path once frontend switches to using the API
    # See https://github.com/centerofci/mathesar/issues/150
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            table = legacy_create_table_from_csv(
                name=form.cleaned_data["table_name"],
                schema=form.cleaned_data["schema_name"],
                database_key=form.cleaned_data["database_key"],
                csv_file=request.FILES["file"]
            )
            return JsonResponse({"pk": table.id}, status=200)
    return render(
        request,
        "mathesar/index.html",
        {
            "common_data": get_common_data(request),
        }
    )
