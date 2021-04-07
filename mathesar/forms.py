from django import forms
from django.core.exceptions import ValidationError

from mathesar.database.schemas import get_all_schemas


def validate_csv(value):
    if not value.name.lower().endswith(".csv"):
        raise ValidationError(f"{value.name} is not a CSV file")

def get_schema_choices():
    """Convert schemas to a form that can be used as a choices argument"""
    return [(s, s) for s in get_all_schemas()]

class UploadFileForm(forms.Form):
    collection_name = forms.CharField(min_length=1, label="Collection Name")
    application_name_toggle = forms.BooleanField(
        label="New Application Name", required=False
    )
    application_name_choice = forms.ChoiceField(
        label="Applications", choices=get_schema_choices, required=False,
    )
    application_name_text = forms.CharField(
        min_length=1, label="Application Name", required=False
    )
    file = forms.FileField(validators=[validate_csv], label="CSV File")
