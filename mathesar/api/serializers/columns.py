from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.fields import empty
from rest_framework.settings import api_settings

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.serializers.shared_serializers import (
    DisplayOptionsMappingSerializer,
    DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY,
)
from mathesar.models import Column


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


class SimpleColumnSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    class Meta:
        model = Column
        fields = ('id',
                  'name',
                  'type',
                  'type_options',
                  'display_options'
                  )
    name = serializers.CharField()
    type = serializers.CharField(source='plain_type')
    type_options = TypeOptionSerializer(required=False, allow_null=True)
    display_options = DisplayOptionsMappingSerializer(required=False, allow_null=True)

    def to_representation(self, instance):
        if isinstance(instance, dict):
            instance_type = instance.get('type')
        else:
            instance_type = instance.plain_type
        self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY] = str(instance_type)
        return super().to_representation(instance)

    def to_internal_value(self, data):
        if self.partial and 'type' not in data:
            instance_type = getattr(self.instance, 'plain_type', None)
            if instance_type is not None:
                self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY] = str(instance_type)
        else:
            self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY] = data.get('type', None)
        return super().to_internal_value(data)


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
            'default'
        )
        model_fields = ('display_options',)

    name = serializers.CharField(required=False, allow_blank=True)

    # From scratch fields
    type = serializers.CharField(source='plain_type', required=False)
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
    valid_target_types = serializers.ListField(read_only=True)

    def validate(self, data):
        data = super().validate(data)
        # Reevaluate column display options based on the new column type.
        if 'plain_type' in data and 'display_options' not in data:
            if self.instance:
                instance_type = getattr(self.instance, 'plain_type', None)
                # Invalidate display_options if type has been changed
                if str(instance_type) != data['plain_type']:
                    data['display_options'] = None
            else:
                data['display_options'] = None
        if not self.partial:
            from_scratch_required_fields = ['type']
            from_scratch_specific_fields = ['type', 'nullable', 'primary_key']
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

    @property
    def validated_model_fields(self):
        return {key: self.validated_data[key] for key in self.validated_data if key in self.Meta.model_fields}
