from django import forms
from django.core.exceptions import ValidationError

from mathesar.database.schemas import get_all_schemas
from mathesar.forms.widgets import DataListInput


def validate_csv(value):
    if not value.name.lower().endswith(".csv"):
        raise ValidationError(f"{value.name} is not a CSV file")


class UploadFileForm(forms.Form):
    collection_name = forms.CharField(min_length=1, label="Collection Name")

    application_name = forms.CharField(
        min_length=1, label="Application Name",
        widget=DataListInput(get_all_schemas)
    )

    file = forms.FileField(validators=[validate_csv], label="CSV File")
