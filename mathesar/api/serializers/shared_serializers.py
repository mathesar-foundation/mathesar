from django.core.exceptions import ImproperlyConfigured
from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.database.types import UIType, get_ui_type_from_db_type


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
        serializer = self.serializers_mapping.get(self.get_mapping_field(instance), None)
        if serializer is not None:
            return serializer.to_representation(instance)
        else:
            return instance

    def get_mapping_field(self, data):
        mapping_field = getattr(self, "mapping_field", None)
        if mapping_field is None:
            raise Exception(
                "Add a `mapping_field` to be used as a identifier"
                "or override this method to return a identifier to identify a proper serializer"
            )
        return mapping_field


class ReadWritePolymorphicSerializerMappingMixin(ReadOnlyPolymorphicSerializerMappingMixin):
    def to_internal_value(self, data):
        serializer = self.serializers_mapping.get(self.get_mapping_field(data))
        if serializer is not None:
            return serializer.to_internal_value(data=data)
        else:
            data = {}
            return data

    def validate(self, attrs):
        serializer = self.serializers_mapping.get(self.get_mapping_field(attrs))
        if serializer is not None:
            return serializer.validate(attrs)
        return {}


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


class MathesarPolymorphicErrorMixin(MathesarErrorMessageMixin):
    def get_serializer_fields(self, data):
        return self.serializers_mapping[self.get_mapping_field(data)].fields


class CustomBooleanLabelSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    TRUE = serializers.CharField()
    FALSE = serializers.CharField()


# This is the key which will determine which display options serializer is used. Its value is
# supposed to be the column's DB type (a DatabaseType instance).
DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY = 'db_type'


class BooleanDisplayOptionSerializer(MathesarErrorMessageMixin, OverrideRootPartialMixin, serializers.Serializer):
    input = serializers.ChoiceField(choices=[("dropdown", "dropdown"), ("checkbox", "checkbox")])
    custom_labels = CustomBooleanLabelSerializer(required=False)


FRACTION_DIGITS_CONFIG = {
    "required": False,
    "allow_null": True,
    "min_value": 0,
    "max_value": 20
}
"""
Max value of 20 is taken from [Intl.NumberFormat docs][1].

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
"""


class AbstractNumberDisplayOptionSerializer(serializers.Serializer):
    number_format = serializers.ChoiceField(required=False, allow_null=True, choices=['english', 'german', 'french', 'hindi', 'swiss'])

    use_grouping = serializers.ChoiceField(required=False, choices=['true', 'false', 'auto'], default='auto')
    """
    The choices here correspond to the options available for the `useGrouping`
    property within the [Intl API][1]. True and False are encoded as strings
    instead of booleans to maintain consistency with the Intl API and to keep
    the type consistent. We did considering using an optional boolean but
    decided a string would be better, especially if we want to support other
    options eventually, like "min2".

    [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
    """

    minimum_fraction_digits = serializers.IntegerField(**FRACTION_DIGITS_CONFIG)
    maximum_fraction_digits = serializers.IntegerField(**FRACTION_DIGITS_CONFIG)


class NumberDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    AbstractNumberDisplayOptionSerializer
):
    show_as_percentage = serializers.BooleanField(default=False)


class MoneyDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    AbstractNumberDisplayOptionSerializer
):
    currency_symbol = serializers.CharField()
    currency_symbol_location = serializers.ChoiceField(choices=['after-minus', 'end-with-space'])


class TimeFormatDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    format = serializers.CharField(max_length=255)


class DateTimeFormatDisplayOptionSerializer(
    MathesarErrorMessageMixin,
    OverrideRootPartialMixin,
    serializers.Serializer
):
    time_format = serializers.CharField(max_length=255)
    date_format = serializers.CharField(max_length=255)


class DurationDisplayOptionSerializer(MathesarErrorMessageMixin, OverrideRootPartialMixin, serializers.Serializer):
    min = serializers.CharField(max_length=255)
    max = serializers.CharField(max_length=255)
    show_units = serializers.BooleanField()


class DisplayOptionsMappingSerializer(
    OverrideRootPartialMixin,
    MathesarPolymorphicErrorMixin,
    ReadWritePolymorphicSerializerMappingMixin,
    serializers.Serializer
):
    serializers_mapping = {
        UIType.BOOLEAN: BooleanDisplayOptionSerializer,
        UIType.NUMBER: NumberDisplayOptionSerializer,
        UIType.DATETIME: DateTimeFormatDisplayOptionSerializer,
        UIType.DATE: TimeFormatDisplayOptionSerializer,
        UIType.TIME: TimeFormatDisplayOptionSerializer,
        UIType.DURATION: DurationDisplayOptionSerializer,
        UIType.MONEY: MoneyDisplayOptionSerializer,
    }

    def get_mapping_field(self, _):
        return self._get_ui_type_of_column_being_serialized()

    def _get_ui_type_of_column_being_serialized(self):
        db_type = self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY]
        ui_type = get_ui_type_from_db_type(db_type)
        return ui_type
