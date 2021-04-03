from django import forms
from django.core.exceptions import ValidationError


def validate_csv(value):
    if not value.name.lower().endswith(".csv"):
        raise ValidationError(f"{value.name} is not a CSV file")


class UploadFileForm(forms.Form):
    name = forms.CharField(min_length=1, label="Collection Name")
    file = forms.FileField(validators=[validate_csv], label="CSV File")
