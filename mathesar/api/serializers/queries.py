from django.urls import reverse
from rest_framework import serializers
from mathesar.models.query import UIQuery


class QuerySerializer(serializers.ModelSerializer):
    records_url = serializers.SerializerMethodField()
    columns_url = serializers.SerializerMethodField()

    class Meta:
        model = UIQuery
        fields = '__all__'

    def get_records_url(self, obj):
        if isinstance(obj, UIQuery):
            # Only get records if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-records', kwargs={'pk': obj.pk}))
        else:
            return None

    def get_columns_url(self, obj):
        if isinstance(obj, UIQuery):
            # Only get columns if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-columns', kwargs={'pk': obj.pk}))
        else:
            return None

    # TODO consider moving to UIQuery field validation:
    # see https://docs.djangoproject.com/en/4.0/ref/validators/
    def validate_initial_columns(self, cols):
        _raise_if_not_list_of_dicts("initial_columns", cols)
        return cols

    # TODO consider moving to UIQuery field validation:
    # see https://docs.djangoproject.com/en/4.0/ref/validators/
    def validate_transformations(self, transforms):
        _raise_if_not_list_of_dicts("transformations", transforms)
        for transform in transforms:
            if "type" not in transform:
                raise serializers.ValidationError("Each 'transformations' sub-dict must have a 'type' key.")
            if "spec" not in transform:
                raise serializers.ValidationError("Each 'transformations' sub-dict must have a 'spec' key.")
        return transforms

    # TODO consider moving to UIQuery field validation:
    # see https://docs.djangoproject.com/en/4.0/ref/validators/
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
