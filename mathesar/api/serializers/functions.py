from rest_framework import serializers

class DbFunctionSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    hints = serializers.ListField(child=serializers.DictField())
