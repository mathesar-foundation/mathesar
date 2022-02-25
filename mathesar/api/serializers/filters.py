from rest_framework import serializers


class FilterSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    aliases = serializers.ListField(child=serializers.DictField(), required=False)
    parameters = serializers.ListField(child=serializers.DictField())
