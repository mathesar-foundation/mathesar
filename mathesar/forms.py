from django import forms


class RecordListFilterForm(forms.Form):
    filters = forms.JSONField(required=False, empty_value=[])
    order_by = forms.JSONField(required=False, empty_value=[])
    group_count_by = forms.JSONField(required=False, empty_value=[])
