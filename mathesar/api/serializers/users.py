from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.models.users import User, DatabaseRole, SchemaRole


class NestedDatabaseRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = DatabaseRole
        fields = ['id', 'database', 'role']


class NestedSchemaRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = SchemaRole
        fields = ['id', 'schema', 'role']


class UserSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    database_roles = NestedDatabaseRoleSerializer(many=True)
    schema_roles = NestedSchemaRoleSerializer(many=True)

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
            'is_superuser': {'read_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class DatabaseRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = DatabaseRole
        fields = ['id', 'user', 'database', 'role']


class SchemaRoleSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = SchemaRole
        fields = ['id', 'user', 'schema', 'role']
