from rest_framework import serializers


class DBFunctionSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    hints = serializers.ListField(child=serializers.DictField())
