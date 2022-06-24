from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin

from mathesar.models import PreviewColumnSettings, TableSettings


class PreviewColumnSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = PreviewColumnSettings
        fields = ['customized', 'template']

    customized = serializers.BooleanField(default=True, read_only=True)
    template = serializers.CharField()

class TableSettingsSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    preview_settings = PreviewColumnSerializer()

    class Meta:
        model = TableSettings
        fields = ['preview_settings']

    def update(self, instance, validated_data):
        preview_settings_data = validated_data.pop('preview_settings', None)
        if preview_settings_data is not None:
            instance.preview_settings.delete()
            preview_settings = PreviewColumnSettings.objects.create(customized=True, **preview_settings_data)
            instance.preview_settings = preview_settings
        return instance
