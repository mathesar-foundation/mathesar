from django import forms
from django.core.exceptions import ValidationError

from mathesar.database.base import create_mathesar_engine
from mathesar.forms.widgets import DataListInput
from db import schemas


engine = create_mathesar_engine()


def validate_csv(value):
    if not value.name.lower().endswith(".csv"):
        raise ValidationError(f"{value.name} is not a CSV file")


class UploadFileForm(forms.Form):
    table_name = forms.CharField(min_length=1, label="Table Name")

    schema_name = forms.CharField(
        min_length=1, label="Schema Name",
        widget=DataListInput(schemas.get_all_schemas(engine))
    )

    file = forms.FileField(validators=[validate_csv], label="CSV File")
