from django.contrib.auth import authenticate
from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin


class LoginSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False,
        write_only=True
    )

    def validate(self, data):
        user = data.get('username')
        pass_ = data.get('password')

        if user and pass_:
            user = authenticate(
                request=self.context.get('request'),
                username=user,
                password=pass_
            )
        data['user'] = user
        return data
