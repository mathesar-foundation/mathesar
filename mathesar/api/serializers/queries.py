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
            return request.build_absolute_uri(reverse('table-record-list', kwargs={'table_pk': obj.pk}))
        else:
            return None

    def get_columns_url(self, obj):
        if isinstance(obj, Query):
            # Only get columns if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('table-column-list', kwargs={'table_pk': obj.pk}))
        else:
            return None
