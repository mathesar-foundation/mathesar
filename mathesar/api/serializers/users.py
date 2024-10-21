from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_access_policy import FieldAccessMixin
from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.exceptions.validation_exceptions.exceptions import IncorrectOldPassword
from mathesar.api.permissions.users import UserAccessPolicy
from mathesar.models.users import User


class UserSerializer(MathesarErrorMessageMixin, FieldAccessMixin, serializers.ModelSerializer):
    access_policy = UserAccessPolicy

    class Meta:
        model = User
        fields = [
            'id',
            'full_name',
            'short_name',
            'username',
            'password',
            'email',
            'is_superuser',
            'display_language'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request", None)
        if not hasattr(request, 'parser_context'):
            return fields
        kwargs = request.parser_context.get('kwargs')
        if kwargs:
            user_pk = kwargs.get('pk')
            if user_pk:
                if request.user.id == int(user_pk) or not request.user.is_superuser:
                    fields["is_superuser"].read_only = True
        return fields

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.password_change_needed = True
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
    old_password = serializers.CharField(write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if user.check_password(value) is True:
            return value
        raise IncorrectOldPassword(field='old_password')

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise e
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance


class PasswordResetSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
