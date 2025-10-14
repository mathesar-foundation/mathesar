from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.data_files import DataFileSerializer


class BulkInsertSerializer(DataFileSerializer, MathesarErrorMessageMixin):
    target_table_oid = serializers.IntegerField()
    database_id = serializers.IntegerField()
    mappings = serializers.ListSerializer(child=serializers.DictField())

    class Meta(DataFileSerializer.Meta):
        fields = DataFileSerializer.Meta.fields + ['database_id', 'target_table_oid', 'mappings']
