from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.exceptions.validation_exceptions.exceptions import InvalidColumnOrder
from mathesar.models.base import PreviewColumnSettings, TableSettings, compute_default_preview_template, ValidationError


class PreviewColumnSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = PreviewColumnSettings
        fields = ['customized', 'template']

    customized = serializers.BooleanField(default=True)
    template = serializers.CharField()


class TableSettingsSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    preview_settings = PreviewColumnSerializer()
    column_order = serializers.ListField(child=serializers.IntegerField())

    class Meta:
        model = TableSettings
        fields = ['id', 'preview_settings', 'column_order']

    def update(self, instance, validated_data):
        preview_settings_data = validated_data.pop('preview_settings', None)
        if preview_settings_data is not None:
            instance.preview_settings.delete()
            # The preview is customised when the client modifies the default template
            if preview_settings_data.get('template', None):
                preview_settings_data['customized'] = True
            if preview_settings_data['customized'] is False:
                preview_settings_data['template'] = compute_default_preview_template(instance.table)
            preview_settings = PreviewColumnSettings.objects.create(**preview_settings_data)
            instance.preview_settings = preview_settings
            instance.save()

        column_order_data = validated_data.pop('column_order', None)
        if column_order_data is not None:
            try:
                instance.column_order = column_order_data
                instance.save()
            except ValidationError:
                raise InvalidColumnOrder()
        return instance
