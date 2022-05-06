from django.urls import reverse
from rest_framework import serializers

from mathesar.api.display_options import get_display_options_for_identifier
from mathesar.api.dj_filters import FILTER_OPTIONS_BY_TYPE_IDENTIFIER
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models import Database


class DatabaseSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
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


class TypeSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    identifier = serializers.CharField()
    name = serializers.CharField()
    db_types = serializers.ListField(child=serializers.CharField())
    filters = serializers.SerializerMethodField()
    display_options = serializers.SerializerMethodField()

    def get_filters(self, obj):
        return FILTER_OPTIONS_BY_TYPE_IDENTIFIER.get(obj.get('identifier'))

    def get_display_options(self, obj):
        return get_display_options_for_identifier(obj.get('identifier'))
