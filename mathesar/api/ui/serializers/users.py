from django.contrib.auth.password_validation import validate_password
from rest_access_policy import FieldAccessMixin, PermittedPkRelatedField
from rest_framework import serializers

from mathesar.api.db.permissions.database import DatabaseAccessPolicy
from mathesar.api.db.permissions.schema import SchemaAccessPolicy
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.exceptions.validation_exceptions.exceptions import IncorrectOldPassword
from mathesar.api.ui.permissions.users import UserAccessPolicy
from mathesar.models.base import Database, Schema
from mathesar.models.users import User, DatabaseRole, SchemaRole


class NestedDatabaseRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = DatabaseRole
        fields = ['id', 'database', 'role']


class NestedSchemaRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = SchemaRole
        fields = ['id', 'schema', 'role']


class UserSerializer(MathesarErrorMessageMixin, FieldAccessMixin, serializers.ModelSerializer):
    database_roles = NestedDatabaseRoleSerializer(many=True, required=False)
    schema_roles = NestedSchemaRoleSerializer(many=True, required=False)
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
            'database_roles',
            'schema_roles',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'is_superuser': {'read_only': True},
            'database_roles': {'read_only': True},
            'schema_roles': {'read_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    old_password = serializers.CharField(write_only=True, required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if user.check_password(value) is True:
            return value
        raise IncorrectOldPassword(field='old_password')

    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance


class PasswordResetSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])


class DatabaseRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = DatabaseRole
        fields = ['id', 'user', 'database', 'role']

    # Restrict the list of databases to which the user has access to create a database role
    # Refer https://rsinger86.github.io/drf-access-policy/policy_reuse/ for the usage of `PermittedPkRelatedField`
    database = PermittedPkRelatedField(
        access_policy=DatabaseAccessPolicy,
        queryset=Database.current_objects.all()
    )


class SchemaRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = SchemaRole
        fields = ['id', 'user', 'schema', 'role']

    schema = PermittedPkRelatedField(
        access_policy=SchemaAccessPolicy,
        queryset=Schema.current_objects.all()
    )
