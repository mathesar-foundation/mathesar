from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.views.generic import DetailView

from mathesar.forms.forms import UploadFileForm
from mathesar.imports.csv import create_table_from_csv
from mathesar.models import Table, Schema
from mathesar.serializers import SchemaSerializer


def index(request):
    tables = Table.objects.all()
    if request.method == "POST":
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            table = create_table_from_csv(
                name=form.cleaned_data["table_name"],
                schema=form.cleaned_data["schema_name"],
                database_key=form.cleaned_data["database_key"],
                csv_file=request.FILES["file"]
            )
            return HttpResponseRedirect(
                reverse("frontend-table-detail", kwargs={"pk": table.id})
            )
    else:
        form = UploadFileForm()
    schema_serializer = SchemaSerializer(Schema.objects.all(), many=True, context={'request': request})
    return render(
        request,
        "mathesar/index.html",
        {
            "form": form,
            "tables": sorted(tables, key=lambda x: x.schema.name),
            "schema_data": schema_serializer.data
        },
    )


class TableDetail(DetailView):
    context_object_name = "table"
    queryset = Table.objects.all()
