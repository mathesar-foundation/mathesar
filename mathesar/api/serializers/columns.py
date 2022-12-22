from rest_framework import serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.fields import empty, SerializerMethodField
from rest_framework.settings import api_settings

from db.columns.exceptions import InvalidTypeError
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
from mathesar.models.base import Column


class InputValueField(serializers.CharField):
    """
    Takes in an arbitrary value. Emulates the record creation endpoint,
    which takes in arbitrary values (un-validated and un-processed request.data).
    This field replicates that behavior in a serializer.
    """

    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        return value


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


def _force_canonical_type(representation, db_type):
    """
    Sometimes the representation's TYPE_KEY attribute will also include type option information
    (e.g. `numeric(3, 5)`). We override the attribute's value to a canonical type id.

    This might be better solved upstream, but since our Column model subclasses SA's Column,
    overriding its TYPE_KEY attribute, might interfere with SA's workings.
    """
    representation[TYPE_KEY] = db_type.id
    return representation


class ColumnDefaultSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    value = InputValueField()
    is_dynamic = serializers.BooleanField(read_only=True)


class ColumnSerializer(SimpleColumnSerializer):
    class Meta(SimpleColumnSerializer.Meta):
        fields = SimpleColumnSerializer.Meta.fields + (
            'nullable',
            'primary_key',
            'source_column',
            'copy_source_data',
            'copy_source_constraints',
            'valid_target_types',
            'default',
            'has_dependents',
        )
        model_fields = (DISPLAY_OPTIONS_KEY,)

    name = serializers.CharField(required=False, allow_blank=True)

    # From scratch fields
    type = serializers.CharField(required=False)
    nullable = serializers.BooleanField(default=True)
    primary_key = serializers.BooleanField(default=False)
    default = ColumnDefaultSerializer(
        source='column_default_dict', required=False, allow_null=True, default=None
    )

    # From duplication fields
    source_column = serializers.PrimaryKeyRelatedField(queryset=Column.current_objects.all(), required=False, write_only=True)
    copy_source_data = serializers.BooleanField(default=True, write_only=True)
    copy_source_constraints = serializers.BooleanField(default=True, write_only=True)

    # Read only fields
    valid_target_types = SerializerMethodField(method_name='get_valid_target_types', read_only=True)

    def validate(self, data):
        data = super().validate(data)
        # Reevaluate column display options based on the new column type.
        if TYPE_KEY in data and self.instance:
            db_type = get_db_type_enum_from_id(data[TYPE_KEY].lower())
            target_types = self.instance.valid_target_types
            if db_type not in target_types:
                raise database_api_exceptions.InvalidTypeCastAPIException(
                    InvalidTypeError,
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            if DISPLAY_OPTIONS_KEY not in data:
                db_type = getattr(self.instance, 'db_type', None)
                # Invalidate display_options if type has been changed
                if db_type is not None:
                    if str(db_type.id) != data[TYPE_KEY]:
                        data[DISPLAY_OPTIONS_KEY] = None
        if not self.partial:
            from_scratch_required_fields = [TYPE_KEY]
            from_scratch_specific_fields = [TYPE_KEY, 'nullable', 'primary_key']
            from_dupe_required_fields = ['source_column']
            from_dupe_specific_fields = ['source_column', 'copy_source_data',
                                         'copy_source_constraints']

            # Note that we run validation on self.initial_data, as `data` has defaults
            # filled in for fields that weren't specified by the request
            from_scratch_required_all = all([
                f in self.initial_data for f in from_scratch_required_fields
            ])
            from_scratch_specific_in = [
                f for f in from_scratch_specific_fields if f in self.initial_data
            ]
            from_dupe_required_all = all([
                f in self.initial_data for f in from_dupe_required_fields
            ])
            from_dupe_specific_in = [
                f for f in from_dupe_specific_fields if f in self.initial_data
            ]

            if len(from_dupe_specific_in) and len(from_scratch_specific_in):
                raise ValidationError(
                    f'{from_scratch_specific_in} cannot be passed in if '
                    f'{from_dupe_specific_in} has also been passed in.'
                )
            elif not from_dupe_required_all and not from_scratch_required_all:
                # We default to from scratch required fields if no fields are passed
                if len(from_dupe_specific_in) and not len(from_scratch_specific_in):
                    required_fields = from_dupe_required_fields
                else:
                    required_fields = from_scratch_required_fields
                raise ValidationError({
                    f: ['This field is required.']
                    for f in required_fields
                    if f not in self.initial_data
                })
        return data
    
    def to_representation(self, instance):
        # Set default display_options for mathesar_money type if none are provided.
        if(
            instance.db_type == MathesarCustomType.MATHESAR_MONEY
            and instance.display_options is None
        ):
            instance.display_options = {
                'use_grouping': 'true',
                'number_format': None,
                'currency_symbol': None,
                'maximum_fraction_digits': 2,
                'minimum_fraction_digits': 2,
                'currency_symbol_location': 'after-minus'}
            instance.save()
        return super().to_representation(instance)

    @property
    def validated_model_fields(self):
        return {key: self.validated_data[key] for key in self.validated_data if key in self.Meta.model_fields}

    def get_valid_target_types(self, column):
        valid_target_types = column.valid_target_types
        if valid_target_types:
            valid_target_type_ids = tuple(
                db_type.id for db_type in valid_target_types
            )
            return valid_target_type_ids
