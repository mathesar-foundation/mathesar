from django.core.exceptions import ImproperlyConfigured
from rest_framework import serializers

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
                '`{cls}.model_serializer_mapping` attribute'.format(
                    cls=cls.__name__
                )
            )
        return super().__new__(cls, *args, **kwargs)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        serializers_mapping = self.serializers_mapping
        self.serializers_mapping = {}
        for identifier, serializer_cls in serializers_mapping.items():
            if callable(serializer_cls):
                serializer = serializer_cls(*args, **kwargs)
                serializer.parent = self
            else:
                serializer = serializer_cls
            self.serializers_mapping[identifier] = serializer

    def to_representation(self, instance):
        serializer = self.serializers_mapping.get(self.get_mapping_field(), None)
        if serializer is not None:
            return serializer.to_representation(instance)
        else:
            raise Exception(f"Cannot find a matching serializer for the specified type {self.get_mapping_field()}")

    def get_mapping_field(self):
        mapping_field = getattr(self, "mapping_field", None)
        if mapping_field is None:
            raise Exception("Add a `mapping_field` to be used as a identifier"
                            "or override this method to return a identifier to identify a proper serializer")
        return mapping_field


class ReadWritePolymorphicSerializerMappingMixin(ReadOnlyPolymorphicSerializerMappingMixin):
    def to_internal_value(self, data):
        serializer = self.serializers_mapping.get(self.get_mapping_field())
        if serializer is not None:
            return serializer.to_internal_value(
                data=data)
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


class CustomBooleanLabelSerializer(serializers.Serializer):
    TRUE = serializers.CharField()
    FALSE = serializers.CharField()


DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY = 'mathesar_type'


class BooleanDisplayOptionSerializer(OverrideRootPartialMixin, serializers.Serializer):
    input = serializers.ChoiceField(choices=[("dropdown", 1), ("checkbox", 2)])
    custom_labels = CustomBooleanLabelSerializer(required=False)


class NumberDisplayOptionSerializer(OverrideRootPartialMixin, serializers.Serializer):
    show_as_percentage = serializers.BooleanField(default=False)
    locale = serializers.CharField(required=False)


class DisplayOptionsMappingSerializer(ReadWritePolymorphicSerializerMappingMixin, serializers.Serializer):
    serializers_mapping = {MathesarTypeIdentifier.BOOLEAN.value: BooleanDisplayOptionSerializer,
                           MathesarTypeIdentifier.NUMBER.value: NumberDisplayOptionSerializer}

    def get_mapping_field(self):
        return get_mathesar_type_from_db_type(self.context[DISPLAY_OPTIONS_SERIALIZER_MAPPING_KEY])
