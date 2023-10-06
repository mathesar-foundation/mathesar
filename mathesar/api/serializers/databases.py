from django.urls import reverse
from rest_framework import serializers

from mathesar.api.display_options import DISPLAY_OPTIONS_BY_UI_TYPE
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.base import Database
from mathesar.api.utils import is_valid_pg_creds
from db.install import install_mathesar


class DatabaseSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    supported_types_url = serializers.SerializerMethodField()

    class Meta:
        model = Database
        fields = ['id', 'name', 'db_name', 'editable', 'supported_types_url', 'username', 'password', 'host', 'port']
        read_only_fields = ['id', 'supported_types_url', 'editable']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_supported_types_url(self, obj):
        if isinstance(obj, Database) and not self.partial:
            # Only get records if we are serializing an existing table
            request = self.context['request']
            return request.build_absolute_uri(reverse('database-types', kwargs={'pk': obj.pk}))
        else:
            return None

    def validate(self, credentials):
        if self.partial:
            db_model = self.instance
            for attr, value in credentials.items():
                setattr(db_model, attr, value)
            credentials = {
                'db_name': db_model.db_name,
                'host': db_model.host,
                'username': db_model.username,
                'password': db_model.password,
                'port': db_model.port
            }
        if is_valid_pg_creds(credentials):
            install_mathesar(
                database_name=credentials["db_name"],
                hostname=credentials["host"],
                username=credentials["username"],
                password=credentials["password"],
                port=credentials["port"],
                skip_confirm=True
            )
        return super().validate(credentials)


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
