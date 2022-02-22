from abc import ABC, abstractmethod

import arrow
from django.core.exceptions import ImproperlyConfigured
from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.database.types import MathesarTypeIdentifier, get_mathesar_type_from_db_type


class ReadOnlyPolymorphicSerializerMappingMixin:
    """
    This serializer mixin is helpful in serializing polymorphic models,
    by switching to correct serializer based on the mapping field value.
    """

    def __new__(cls, *args, **kwargs):
        if cls.serializers_mapping is None:
            raise ImproperlyConfigured(
                '`{cls}` is missing a '
                '`{cls}.model_serializer_mapping` attribute'.format(cls=cls.__name__)
            )
        return super().__new__(cls, *args, **kwargs)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.serializers_cls_mapping = {}
        serializers_mapping = self.serializers_mapping
        self.serializers_mapping = {}
        for identifier, serializer_cls in serializers_mapping.items():
            if callable(serializer_cls):
                serializer = serializer_cls(*args, **kwargs)
                serializer.parent = self
            else:
                serializer = serializer_cls
            self.serializers_mapping[identifier] = serializer
            self.serializers_cls_mapping[identifier] = serializer_cls

    def to_representation(self, instance):
        serializer = self.serializers_mapping.get(self.get_mapping_field(), None)
        if serializer is not None:
            self.__class__ = self.serializers_cls_mapping.get(self.get_mapping_field())
            return serializer.to_representation(instance)
        else:
            raise Exception(f"Cannot find a matching serializer for the specified type {self.get_mapping_field()}")

    def get_mapping_field(self):
        mapping_field = getattr(self, "mapping_field", None)
        if mapping_field is None:
            raise Exception(
                "Add a `mapping_field` to be used as a identifier"
                "or override this method to return a identifier to identify a proper serializer"
            )
        return mapping_field


class ReadWritePolymorphicSerializerMappingMixin(ReadOnlyPolymorphicSerializerMappingMixin):
    def to_internal_value(self, data):
        serializer = self.serializers_mapping.get(self.get_mapping_field())
        if serializer is not None:
            self.__class__ = self.serializers_cls_mapping.get(self.get_mapping_field())
            return serializer.to_internal_value(data=data)
        else:
            raise Exception(f"Cannot find a matching serializer for the specified type {self.get_mapping_field()}")


class MonkeyPatchPartial:
    """
    Work around bug #3847 in djangorestframework by monkey-patching the partial
    attribute of the root serializer during the call to validate_empty_values.
    https://github.com/encode/django-rest-framework/issues/3847
    """

    def __init__(self, root):
        self._root = root

    def __enter__(self):
        self._old = getattr(self._root, 'partial')
        setattr(self._root, 'partial', False)

    def __exit__(self, *args):
        setattr(self._root, 'partial', self._old)


class OverrideRootPartialMixin:
    """
    This mixin is used to convert a serializer into a partial serializer,
    based on the serializer `partial` property rather than the parent's `partial` property.
    Refer to the issue
        https://github.com/encode/django-rest-framework/issues/3847
    """

    def run_validation(self, *args, **kwargs):
        if not self.partial:
            with MonkeyPatchPartial(self.root):
                return super().run_validation(*args, **kwargs)
        return super().run_validation(*args, **kwargs)


class CustomBooleanLabelSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    TRUE = serializers.CharField()
    FALSE = serializers.CharField()


DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY = 'mathesar_type'


class BooleanDisplayOptionSerializer(MathesarErrorMessageMixin, OverrideRootPartialMixin, serializers.Serializer):
    input = serializers.ChoiceField(choices=[("dropdown", 1), ("checkbox", 2)])
    custom_labels = CustomBooleanLabelSerializer(required=False)


class NumberDisplayOptionSerializer(MathesarErrorMessageMixin, OverrideRootPartialMixin, serializers.Serializer):
    show_as_percentage = serializers.BooleanField(default=False)
    locale = serializers.CharField(required=False)


class AbstractDateTimeFormatValidator(ABC):
    requires_context = True

    def __init__(self):
        pass

    def __call__(self, value, serializer_field):
        self.date_format_validator(value, serializer_field)

    def date_format_validator(self, value, serializer_field):
        try:
            timestamp_with_tz_obj = arrow.get('2013-09-30T15:34:00.000-07:00')
            parsed_datetime_str = timestamp_with_tz_obj.format(value)
            datetime_object = arrow.get(parsed_datetime_str, value)
        except ValueError:
            raise serializers.ValidationError(f"{value} is not a valid format used for parsing a datetime.")
        else:
            self.validate(datetime_object, value, serializer_field)

    @abstractmethod
    def validate(self, datetime_obj, display_format, serializer_field):
        pass


class TimestampWithTimeZoneFormatValidator(AbstractDateTimeFormatValidator):

    def validate(self, datetime_obj, display_format, serializer_field):
        pass


class TimestampWithoutTimeZoneFormatValidator(AbstractDateTimeFormatValidator):

    def validate(self, datetime_obj, display_format, serializer_field):
        if 'z' in display_format.lower():
            raise serializers.ValidationError(
                "Timestamp without timezone column cannot contain timezone display format"
            )


class DateFormatValidator(AbstractDateTimeFormatValidator):

    def validate(self, datetime_obj, display_format, serializer_field):
        date_obj = arrow.get('2013-09-30')
        if datetime_obj.time() != date_obj.time():
            raise serializers.ValidationError("Date column cannot contain time or timezone display format")


class TimeWithTimeZoneFormatValidator(AbstractDateTimeFormatValidator):

    def validate(self, datetime_obj, display_format, serializer_field):
        time_only_format = 'HH:mm:ssZZ'
        time_str = arrow.get('2013-09-30T15:34:00.000-07:00').format(time_only_format)
        parsed_time_str = arrow.get(time_str, time_only_format)
        if parsed_time_str.date() != datetime_obj.date():
            raise serializers.ValidationError("Time column cannot contain date display format")


class TimeWithoutTimeZoneFormatValidator(TimeWithTimeZoneFormatValidator):

    def validate(self, datetime_obj, display_format, serializer_field):
        if 'z' in display_format.lower():
            raise serializers.ValidationError("Time without timezone column cannot contain timezone display format")
        return super().validate(datetime_obj, display_format, serializer_field)


class DateDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    date_format = serializers.CharField(validators=[DateFormatValidator()])


class TimestampWithoutTimezoneDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    time_format = serializers.CharField(validators=[TimeWithoutTimeZoneFormatValidator()])
    date_format = serializers.CharField(validators=[DateFormatValidator()])


class TimestampWithTimezoneDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    time_format = serializers.CharField(validators=[TimeWithTimeZoneFormatValidator()])
    date_format = serializers.CharField(validators=[DateFormatValidator()])


class TimeWithTimezoneDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    time_format = serializers.CharField(validators=[TimeWithTimeZoneFormatValidator()])


class TimeWithoutTimezoneDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    time_format = serializers.CharField(validators=[TimeWithoutTimeZoneFormatValidator()])


class DisplayOptionsMappingSerializer(
    MathesarErrorMessageMixin,
    ReadWritePolymorphicSerializerMappingMixin,
    serializers.Serializer
):
    serializers_mapping = {
        MathesarTypeIdentifier.BOOLEAN.value: BooleanDisplayOptionSerializer,
        MathesarTypeIdentifier.NUMBER.value: NumberDisplayOptionSerializer,
        ('timestamp with time zone',
         MathesarTypeIdentifier.DATETIME.value): TimestampWithTimezoneDisplayOptionSerializer,
        ('timestamp without time zone',
         MathesarTypeIdentifier.DATETIME.value): TimestampWithoutTimezoneDisplayOptionSerializer,
        ('date', MathesarTypeIdentifier.DATE.value): DateDisplayOptionSerializer,
        ('time with time zone', MathesarTypeIdentifier.TIME.value): TimeWithTimezoneDisplayOptionSerializer,
        ('time without time zone', MathesarTypeIdentifier.TIME.value): TimeWithoutTimezoneDisplayOptionSerializer,
    }

    def get_mapping_field(self):
        mathesar_type = get_mathesar_type_from_db_type(self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY])
        if mathesar_type == MathesarTypeIdentifier.DATETIME.value:
            return self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY].lower(), mathesar_type
        else:
            return mathesar_type
