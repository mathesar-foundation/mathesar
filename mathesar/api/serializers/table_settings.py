from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin

from mathesar.models import PreviewColumnSettings, TableSettings


class PreviewColumnSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = PreviewColumnSettings
        fields = ['columns', 'customized']

    customized = serializers.BooleanField(default=True)


class TableSettingsSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):
    preview_columns = PreviewColumnSerializer()

    class Meta:
        model = TableSettings
        fields = ['preview_columns']

    def create(self, validated_data):
        preview_column_data = validated_data.pop('preview_columns')
        preview_columns = preview_column_data.pop('columns')
        preview_column_settings = PreviewColumnSettings.objects.create(**preview_column_data)
        preview_column_settings.columns.set(preview_columns)
        table = self.context['table']
        table_settings = TableSettings.objects.create(
            **validated_data,
            table=table,
            preview_columns=preview_column_settings
        )
        return table_settings
