from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin

from mathesar.models import PreviewColumnSettings, TableSettings


class PreviewColumnSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = PreviewColumnSettings
        fields = ['columns', 'customized']

    customized = serializers.BooleanField(default=True, read_only=True)


class TableSettingsSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    preview_columns = PreviewColumnSerializer()

    class Meta:
        model = TableSettings
        fields = ['preview_columns']

    def update(self, instance, validated_data):
        preview_column_data = validated_data.pop('preview_columns', None)
        if preview_column_data is not None:
            preview_columns = preview_column_data.pop('columns')
            instance.preview_columns.delete()
            preview_column_settings = PreviewColumnSettings.objects.create(customized=True)
            preview_column_settings.columns.set(preview_columns)
            instance.preview_columns = preview_column_settings
        return instance
