from django.urls import reverse
from rest_framework import serializers
from mathesar.models.query import UIQuery
from django.core.exceptions import ValidationError


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
        if isinstance(obj, UIQuery) and obj.pk is not None:
            # Only get records_url if we are serializing an existing persisted UIQuery
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-records', kwargs={'pk': obj.pk}))
        else:
            return None

    def get_columns_url(self, obj):
        if isinstance(obj, UIQuery) and obj.pk is not None:
            # Only get columns_url if we are serializing an existing persisted UIQuery
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-columns', kwargs={'pk': obj.pk}))
        else:
            return None

    def validate(self, attrs):
        unexpected_fields = set(self.initial_data) - set(self.fields)
        if unexpected_fields:
            raise ValidationError(f"Unexpected field(s): {unexpected_fields}")
        return attrs
