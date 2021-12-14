from django.urls import reverse
from rest_framework import serializers

from mathesar.models import Database


class DatabaseSerializer(serializers.ModelSerializer):
    supported_types_url = serializers.SerializerMethodField()

    class Meta:
        model = Database
        fields = ['id', 'name', 'deleted', 'supported_types_url']
        read_only_fields = ['id', 'name', 'deleted', 'supported_types_url']

    def get_supported_types_url(self, obj):
        if isinstance(obj, Database):
            # Only get records if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('database-types', kwargs={'pk': obj.pk}))
        else:
            return None


class TypeSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    name = serializers.CharField()
    db_types = serializers.ListField(child=serializers.CharField())


class FilterSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    name = serializers.CharField()
    position = serializers.CharField()
    parameter_count = serializers.CharField()
    ma_types = serializers.ListField(child=serializers.CharField())
    settings = serializers.ListField(child=serializers.DictField(), allow_null=True)
