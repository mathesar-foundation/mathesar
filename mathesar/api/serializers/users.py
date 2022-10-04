from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.users import User


class UserSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'short_name', 'username', 'password', 'email']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
