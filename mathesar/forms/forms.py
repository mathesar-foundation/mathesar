# TODO: Remove this file once frontend switches to using the API
# See https://github.com/centerofci/mathesar/issues/150

from django import forms
from django.core.exceptions import ValidationError

from mathesar.database.utils import get_non_default_database_keys
from mathesar.forms.widgets import DataListInput
from mathesar.models import Schema


def validate_csv(value):
    if not value.name.lower().endswith('.csv'):
        raise ValidationError(f'{value.name} is not a CSV file')


def get_schemas():
    return [schema.name for schema in Schema.objects.all()]


class UploadFileForm(forms.Form):
    table_name = forms.CharField(min_length=1, label='Table Name')
    schema_name = forms.CharField(
        min_length=1, label='Schema Name',
        widget=DataListInput(get_schemas)
    )
    database_key = forms.ChoiceField(
        choices=[(key, key) for key in get_non_default_database_keys()],
        label='Database'
    )
    file = forms.FileField(validators=[validate_csv], label='CSV File')


class RecordListFilterForm(forms.Form):
    filters = forms.JSONField(required=False, empty_value=[])
    order_by = forms.JSONField(required=False, empty_value=[])
    group_count_by = forms.JSONField(required=False, empty_value=[])
