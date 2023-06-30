from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin

from mathesar.models.base import ColumnSettings


class ColumnSettingsSerializer(MathesarErrorMessageMixin, serializers.HyperlinkedModelSerializer):

    class Meta:
        model = ColumnSettings
        fields = ['id', 'width']
