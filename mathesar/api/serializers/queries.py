from django.urls import reverse
from rest_framework import serializers
from mathesar.models import Query


class QuerySerializer(serializers.ModelSerializer):
    records_url = serializers.SerializerMethodField()
    columns_url = serializers.SerializerMethodField()

    class Meta:
        model = Query
        fields = '__all__'

    def get_records_url(self, obj):
        if isinstance(obj, Query):
            # Only get records if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-records', kwargs={'pk': obj.pk}))
        else:
            return None

    def get_columns_url(self, obj):
        if isinstance(obj, Query):
            # Only get columns if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-columns', kwargs={'pk': obj.pk}))
        else:
            return None

    def validate_initial_columns(self, cols):
        _raise_if_not_list_of_dicts("initial_columns", cols)
        return cols

    def validate_transformations(self, transforms):
        _raise_if_not_list_of_dicts("transformations", transforms)
        return transforms

    def validate_display_options(self, display_options):
        if not isinstance(display_options, dict):
            raise serializers.ValidationError("display_options should be a dict.")
        return display_options


def _raise_if_not_list_of_dicts(field_name, value):
    if not isinstance(value, list):
        raise serializers.ValidationError(f"{field_name} should be a list.")
    for subvalue in value:
        if not isinstance(subvalue, dict):
            raise serializers.ValidationError(f"{field_name} should contain only dicts.")
