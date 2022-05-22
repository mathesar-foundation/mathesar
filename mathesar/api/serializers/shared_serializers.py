from django.core.exceptions import ImproperlyConfigured
from rest_framework import serializers

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.database.types import MathesarTypeIdentifier, get_mathesar_type_from_db_type


class ReadOnlyPolymorphicSerializerMappingMixin:
    """
    This serializer mixin is helpful in serializing polymorphic models,
    by switching to correct serializer based on the mapping field value.
    """
    default_serializer = None

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
        if self.default_serializer is not None:
            self.default_serializer = self.default_serializer(*args, **kwargs)
        for identifier, serializer_cls in serializers_mapping.items():
            if callable(serializer_cls):
                serializer = serializer_cls(*args, **kwargs)
                serializer.parent = self
            else:
                serializer = serializer_cls
            self.serializers_mapping[identifier] = serializer
            self.serializers_cls_mapping[identifier] = serializer_cls

    def get_serializer_class(self, identifier):
        if identifier in self.serializers_mapping:
            return self.serializers_mapping.get(identifier)
        else:
            return self.default_serializer

    def to_representation(self, instance):
        serializer = self.get_serializer_class(self.get_mapping_field(instance))
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
        serializer = self.get_serializer_class(self.get_mapping_field(data))
        if serializer is not None:
            return serializer.to_internal_value(data=data)
        else:
            data = {}
            return data


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


class BaseDisplayOptionsSerializer(MathesarErrorMessageMixin, OverrideRootPartialMixin, serializers.Serializer):
    show_fk_preview = serializers.BooleanField(default=True)


class CustomBooleanLabelSerializer(MathesarErrorMessageMixin, serializers.Serializer):
    TRUE = serializers.CharField()
    FALSE = serializers.CharField()


DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY = 'db_type'


class BooleanDisplayOptionSerializer(BaseDisplayOptionsSerializer):
    input = serializers.ChoiceField(choices=[("dropdown", "dropdown"), ("checkbox", "checkbox")])
    custom_labels = CustomBooleanLabelSerializer(required=False)


class AbstractNumberDisplayOptionSerializer(BaseDisplayOptionsSerializer):
    number_format = serializers.ChoiceField(
        required=False,
        allow_null=True,
        choices=['english', 'german', 'french', 'hindi', 'swiss']
    )


class NumberDisplayOptionSerializer(AbstractNumberDisplayOptionSerializer):
    show_as_percentage = serializers.BooleanField(default=False)


class MoneyDisplayOptionSerializer(AbstractNumberDisplayOptionSerializer):
    currency_symbol = serializers.CharField()
    currency_symbol_location = serializers.ChoiceField(choices=['after-minus', 'end-with-space'])


class TimeFormatDisplayOptionSerializer(BaseDisplayOptionsSerializer):
    format = serializers.CharField(max_length=255)


class DateTimeFormatDisplayOptionSerializer(BaseDisplayOptionsSerializer):
    time_format = serializers.CharField(max_length=255)
    date_format = serializers.CharField(max_length=255)


class DurationDisplayOptionSerializer(BaseDisplayOptionsSerializer):
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
        MathesarTypeIdentifier.BOOLEAN.value: BooleanDisplayOptionSerializer,
        MathesarTypeIdentifier.DATETIME.value: DateTimeFormatDisplayOptionSerializer,
        MathesarTypeIdentifier.DATE.value: TimeFormatDisplayOptionSerializer,
        MathesarTypeIdentifier.DURATION.value: DurationDisplayOptionSerializer,
        MathesarTypeIdentifier.MONEY.value: MoneyDisplayOptionSerializer,
        MathesarTypeIdentifier.NUMBER.value: NumberDisplayOptionSerializer,
        MathesarTypeIdentifier.TIME.value: TimeFormatDisplayOptionSerializer,
    }
    default_serializer = BaseDisplayOptionsSerializer

    def get_mapping_field(self, data):
        db_type = self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY]
        mathesar_type = get_mathesar_type_from_db_type(db_type)
        return mathesar_type
