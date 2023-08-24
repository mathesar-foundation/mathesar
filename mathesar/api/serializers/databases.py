from django.urls import reverse
from rest_framework import serializers

from mathesar.api.display_options import DISPLAY_OPTIONS_BY_UI_TYPE
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Database


class DatabaseSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    db_name = serializers.CharField()
    db_username = serializers.CharField()
    db_password = serializers.CharField()
    db_host = serializers.CharField()
    db_port = serializers.IntegerField()
    supported_types_url = serializers.SerializerMethodField()

    class Meta:
        model = Database
        fields = ['id', 'db_name', 'deleted', 'supported_types_url', 'db_username', 'db_password', 'db_host', 'db_port']
        read_only_fields = ['id', 'deleted', 'supported_types_url']

    def validate(self, data):
        if self.partial:
            # XOR to check whether we are receiving both username & password during a patch request.
            if bool(data.get('db_username')) is not bool(data.get('db_password')):
                raise Exception("Both username & password are required")
        return data

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
    display_options = serializers.DictField()

    def to_representation(self, ui_type):
        primitive = dict(
            identifier=ui_type.id,
            name=ui_type.display_name,
            db_types=ui_type.db_types,
            display_options=DISPLAY_OPTIONS_BY_UI_TYPE.get(ui_type, None),
        )
        return super().to_representation(primitive)
