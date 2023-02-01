from django.utils.deconstruct import deconstructible
from mathesar.api.exceptions.validation_exceptions.exceptions import InvalidValueType, DictHasBadKeys


@deconstructible
class ListOfDictValidator:

    def __init__(self, field_name):
        if field_name is not None:
            self.field_name = field_name

    def __call__(self, value):
        if not isinstance(value, list):
            message = f"{value} should be a list."
            raise InvalidValueType(message, field=self.field_name)
        for subvalue in value:
            if not isinstance(subvalue, dict):
                message = f"{value} should contain only dicts."
                raise InvalidValueType(message, field=self.field_name)

    def __eq__(self, other):
        return (
            isinstance(other, ListOfDictValidator) and self.field_name == other.field_name
        )


@deconstructible
class InitialColumnsValidator:

    def __init__(self, field_name):
        if field_name is not None:
            self.field_name = field_name

    def __call__(self, value):
        for initial_col in value:
            keys = set(initial_col.keys())
            obligatory_keys = {
                "id",
                "alias",
            }
            missing_obligatory_keys = obligatory_keys.difference(keys)
            if missing_obligatory_keys:
                message = (
                    f"{initial_col} doesn't contain"
                    f" following obligatory keys: {missing_obligatory_keys}."
                )
                raise DictHasBadKeys(message, field=self.field_name)
            optional_keys = {
                "jp_path",
            }
            valid_keys = {
                *obligatory_keys,
                *optional_keys,
            }
            unexpected_keys = keys.difference(valid_keys)
            if unexpected_keys:
                message = f"{initial_col} contains unexpected keys: {unexpected_keys}."
                raise DictHasBadKeys(message, field=self.field_name)
            jp_path = initial_col.get('jp_path')
            jp_path_validator = JpPathValidator(self.field_name)
            jp_path_validator(jp_path)

    def __eq__(self, other):
        return (
            isinstance(other, InitialColumnsValidator) and self.field_name == other.field_name
        )


@deconstructible
class JpPathValidator:

    def __init__(self, field_name):
        if field_name:
            self.field_name = field_name

    def __call__(self, value):
        if value:
            if not isinstance(value, list):
                message = f"jp_path must be a list, instead: {value}."
                raise InvalidValueType(
                    message,
                    field=self.field_name,
                )
            for jp in value:
                if not isinstance(jp, list):
                    message = f"jp_path elements must be 2-item lists, instead: {jp}."
                    raise InvalidValueType(
                        message,
                        field=self.field_name,
                    )
                for col_id in jp:
                    if not isinstance(col_id, int):
                        message = (
                            "jp_path elements must only contain integer column"
                            f" ids, instead: {jp}."
                        )
                        raise InvalidValueType(
                            message,
                            field=self.field_name,
                        )

    def __eq__(self, other):
        return (
            isinstance(other, JpPathValidator) and self.field_name == other.field_name
        )


@deconstructible
class TransformationsValidator:

    def __init__(self, field_name):
        if field_name is not None:
            self.field_name = field_name

    def __call__(self, value):
        for transformation in value:
            if "type" not in transformation:
                message = "Each 'transformations' sub-dict must have a 'type' key."
                raise DictHasBadKeys(message, field=self.field_name)
            if "spec" not in transformation:
                message = "Each 'transformations' sub-dict must have a 'spec' key."
                raise DictHasBadKeys(message, field=self.field_name)

    def __eq__(self, other):
        return (
            isinstance(other, TransformationsValidator) and self.field_name == other.field_name
        )


@deconstructible
class DictValidator:

    def __init__(self, field_name):
        if field_name is not None:
            self.field_name = field_name

    def __call__(self, value):
        if not isinstance(value, dict):
            message = f"{value} should be a dict."
            raise InvalidValueType(message, field=self.field_name)

    def __eq__(self, other):
        return (
            isinstance(other, TransformationsValidator) and self.field_name == other.field_name
        )
