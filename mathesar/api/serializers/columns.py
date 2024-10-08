from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.fields import empty, SerializerMethodField
from rest_framework.settings import api_settings

from db.identifiers import is_identifier_too_long
from db.columns.exceptions import InvalidTypeError
from mathesar.api.exceptions.database_exceptions.exceptions import DynamicDefaultModificationError
from db.columns.exceptions import InvalidTypeOptionError
from db.types.base import PostgresType, MathesarCustomType
from db.types.operations.convert import get_db_type_enum_from_id
from mathesar.api.exceptions.database_exceptions import (
    exceptions as database_api_exceptions
)
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.shared_serializers import (
    DisplayOptionsMappingSerializer,
    DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY,
)
from mathesar.models.deprecated import Column


class TypeOptionSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    length = serializers.IntegerField(required=False)
    precision = serializers.IntegerField(required=False)
    scale = serializers.IntegerField(required=False)
    fields = serializers.CharField(required=False)

    def validate(self, attrs):
        db_type = self.context.get('db_type', None)
        scale = attrs.get('scale', None)
        precision = attrs.get('precision', None)
        if (
            db_type == PostgresType.NUMERIC
            and (scale is None) != (precision is None)
        ):
            raise database_api_exceptions.InvalidTypeOptionAPIException(
                InvalidTypeOptionError,
                message='Both scale and precision fields are required.',
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        return super().validate(attrs)

    def run_validation(self, data=empty):
        # Ensure that there are no unknown type options passed in.
        if data is not empty and data is not None:
            unknown = set(data) - set(self.fields)
            if unknown:
                errors = ['Unknown field: {}'.format(field) for field in unknown]
                raise serializers.ValidationError({
                    api_settings.NON_FIELD_ERRORS_KEY: errors,
                })

        return super(TypeOptionSerializer, self).run_validation(data)


TYPE_KEY = 'type'
DISPLAY_OPTIONS_KEY = 'display_options'


class SimpleColumnSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ('id',
                  'name',
                  TYPE_KEY,
                  'type_options',
                  DISPLAY_OPTIONS_KEY,
                  )
    id = serializers.IntegerField(required=False)
    name = serializers.CharField()
    # TODO consider renaming type and type_options to db_type and db_type_options
    # The name of below attribute should match value of TYPE_KEY
    type = serializers.CharField()
    type_options = TypeOptionSerializer(required=False, allow_null=True)
    # The name of below attribute should match value of DISPLAY_OPTIONS_KEY
    display_options = DisplayOptionsMappingSerializer(required=False, allow_null=True)

    def to_representation(self, instance):
        if isinstance(instance, dict):
            db_type_id = instance.get(TYPE_KEY)
            db_type = get_db_type_enum_from_id(db_type_id)
        else:
            db_type = instance.db_type
        # TODO replace or remove this assert before production
        assert db_type is not None
        self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY] = db_type
        representation = super().to_representation(instance)
        _force_canonical_type(representation, db_type)
        return representation

    def to_internal_value(self, data):
        if self.partial and TYPE_KEY not in data:
            db_type = getattr(self.instance, 'db_type', None)
        else:
            db_type_id = data.get(TYPE_KEY, None)
            db_type = get_db_type_enum_from_id(db_type_id) if db_type_id else None
        self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY] = db_type
        return super().to_internal_value(data)

    def validate_name(self, name):
        if is_identifier_too_long(name):
            raise database_api_exceptions.IdentifierTooLong(field='name')
        return name


def _force_canonical_type(representation, db_type):
    """
    Sometimes the representation's TYPE_KEY attribute will also include type option information
    (e.g. `numeric(3, 5)`). We override the attribute's value to a canonical type id.

    This might be better solved upstream, but since our Column model subclasses SA's Column,
    overriding its TYPE_KEY attribute, might interfere with SA's workings.
    """
    representation[TYPE_KEY] = db_type.id
    return representation
