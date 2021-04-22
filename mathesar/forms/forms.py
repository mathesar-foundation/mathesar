from django import forms
from django.core.exceptions import ValidationError

from mathesar.forms.widgets import DataListInput
from mathesar.models import Schema


def validate_csv(value):
    if not value.name.lower().endswith(".csv"):
        raise ValidationError(f"{value.name} is not a CSV file")


def get_schemas():
    return [schema.name for schema in Schema.objects.all()]


class UploadFileForm(forms.Form):
    table_name = forms.CharField(min_length=1, label="Table Name")

    schema_name = forms.CharField(
        min_length=1, label="Schema Name",
        widget=DataListInput(get_schemas)
    )

    file = forms.FileField(validators=[validate_csv], label="CSV File")
