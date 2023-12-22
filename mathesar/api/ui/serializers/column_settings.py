from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin

from mathesar.models.base import ColumnSetting


class ColumnSettingsSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):

    class Meta:
        model = ColumnSetting
        fields = ['id', 'width']
