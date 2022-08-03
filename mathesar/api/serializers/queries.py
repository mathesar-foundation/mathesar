from django.urls import reverse
from rest_framework import serializers
from mathesar.models.query import UIQuery


class QuerySerializer(serializers.ModelSerializer):
    records_url = serializers.SerializerMethodField('get_records_url')
    columns_url = serializers.SerializerMethodField('get_columns_url')
    schema = serializers.SerializerMethodField('get_schema')

    class Meta:
        model = UIQuery
        fields = '__all__'

    def get_schema(self, uiquery):
        base_table = uiquery.base_table
        if base_table:
            return base_table.schema.id

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
    def validate_display_options(self, display_options):
        if not isinstance(display_options, dict):
            raise serializers.ValidationError("display_options should be a dict.")
        return display_options
