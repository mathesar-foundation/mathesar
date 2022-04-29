from rest_framework import serializers


class ParameterSerializer(serializers.Serializer):
    ui_types = serializers.ListField(child=serializers.CharField())


class AliasSerializer(serializers.Serializer):
    alias = serializers.CharField()
    ui_types = serializers.ListField(child=serializers.CharField())


class FilterSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    aliases = serializers.ListField(child=AliasSerializer(), required=False)
    parameters = serializers.ListField(child=ParameterSerializer())
