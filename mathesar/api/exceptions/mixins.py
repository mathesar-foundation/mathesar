from rest_framework.serializers import ListSerializer, Serializer
from rest_framework.utils.serializer_helpers import ReturnList
from rest_framework_friendly_errors.mixins import FriendlyErrorMessagesMixin
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as RestValidationError
from mathesar.api.exceptions.generic_exceptions.base_exceptions import ErrorBody


class MathesarErrorMessageMixin(FriendlyErrorMessagesMixin):
    def is_pretty(self, error):
        return isinstance(error, dict) and tuple(error.keys()) == ErrorBody._fields

    def build_pretty_errors(self, errors, serializer=None):

        """
        This method build on top of `build_pretty_errors` method of the superclass
        It provides the following additional features
        1. Avoids processing prettified exceptions
        2. Add field to the pretty exception body if raised by field validation method
        """
        pretty = []
        if self.is_pretty(errors):
            # DRF serializers supports error any of the following format, error string, list of error strings or {'field': [error strings]}
            # Since our exception is an object instead of a string, the object properties are mistaken to be fields of a serializer,
            # and it gets converted into {'field': [error strings]} by DRF
            # We need to convert it to dictionary of list of object and return it instead of passing it down the line
            scalar_errors = dict(map(lambda item: (item[0], item[1][0] if type(item[1]) == list else item[1]), errors.items()))
            return [scalar_errors]
        for error_type in errors:
            error = errors[error_type]
            if error_type == 'non_field_errors':
                if self.is_pretty(error):
                    pretty.append(error)
                else:
                    pretty.extend(self.get_non_field_error_entries(errors[error_type]))
            else:
                field = self.get_serializer_fields(self.initial_data).fields[error_type]
                if isinstance(field, Serializer) and type(errors[error_type]) == dict:
                    field.initial_data = self.initial_data[error_type]
                    child_errors = field.build_pretty_errors(errors[error_type])
                    pretty += child_errors
                    continue
                if isinstance(field, ListSerializer) and type(errors[error_type]) == list:
                    pretty_child_errors = []
                    for index, child_error in enumerate(errors[error_type]):
                        child_field = field.child
                        initial_data = self.initial_data.get(error_type, None)
                        if initial_data is not None:
                            child_field.initial_data = self.initial_data[error_type][index]
                        else:
                            child_field.initial_data = None
                        if isinstance(child_error, str):
                            pretty_child_errors.append(self.get_field_error_entry(child_error, field))
                        else:
                            child_errors = child_field.build_pretty_errors(child_error)
                            pretty_child_errors.extend(child_errors)
                    pretty.extend(pretty_child_errors)
                    continue
                if self.is_pretty(error):
                    if 'field' not in error or error['field'] is None or str(error['field']) == 'None':
                        error['field'] = error_type
                    pretty.append(error)
                else:
                    pretty.extend(self.get_field_error_entries(errors[error_type], field))
        if pretty:
            return pretty
        return []

    def get_serializer_fields(self, data):
        return self.fields

    def _run_validator(self, validator, field, message):
        """
        This method build on top of `_run_validator` method of the superclass
        It provides the following additional features
        1. Includes serializer if `required_context` is True similar to the behaviour of drf
        """
        try:
            args = []
            if getattr(validator, 'requires_context', False):
                args.append(field)
            validator(self.initial_data[field.field_name], *args)
        except (DjangoValidationError, RestValidationError) as err:
            err_message = err.detail[0] if hasattr(err, 'detail') else err.message
            return err_message == message

    @property
    def errors(self):
        """
        This method build on top of `errors` property of the superclass to return a list instead of a dictionary
        """
        ugly_errors = super(FriendlyErrorMessagesMixin, self).errors
        pretty_errors = self.build_pretty_errors(ugly_errors)
        return ReturnList(pretty_errors, serializer=self)

    @property
    def field_map(self):
        """
        This method build on top of `field_map` property of the superclass
        It provides the following additional features
        1. Adds `ListSerializer` to `relation` field list
        """
        parent_field_map = super(FriendlyErrorMessagesMixin, self).field_map
        # Add missing `ListSerializer to existing relation list`
        parent_field_map['relation'].append('ListSerializer')
        parent_field_map['relation'].append('PermittedPkRelatedField')
        parent_field_map['relation'].append('PermittedSlugRelatedField')
        return parent_field_map

    def get_field_kwargs(self, field, field_data):
        """
        This method build on top of `get_field_kwargs` method of the superclass
        It provides the following fixes
        1. Fixes file type length value to use name of the file instead of the size of the file,
         matching the default behaviour of drf
        """
        field_type = field.__class__.__name__
        kwargs = {
            'data_type': type(field_data).__name__
        }
        if field_type in self.field_map['boolean']:
            kwargs.update({'input': field_data})
        elif field_type in self.field_map['string']:
            kwargs.update(
                {
                    'max_length': getattr(field, 'max_length', None),
                    'min_length': getattr(field, 'min_length', None),
                    'value': field_data
                }
            )
        elif field_type in self.field_map['numeric']:

            kwargs.update(
                {
                    'min_value': field.min_value,
                    'max_value': field.max_value,
                    'decimal_places': getattr(field, 'decimal_places', None),
                    'max_decimal_places': getattr(field, 'decimal_places', None),
                    'max_digits': getattr(field, 'max_digits', None)
                }
            )
            max_digits = kwargs['max_digits']
            decimal_places = kwargs['decimal_places']
            if max_digits is not None and decimal_places is not None:
                whole_digits = max_digits - decimal_places
                kwargs.update({'max_whole_digits': whole_digits})
        elif field_type in self.field_map['date'].keys():
            kwargs.update({'format': self.field_map['date'][field_type]})
        elif field_type in self.field_map['choice']:
            kwargs.update(
                {
                    'input': field_data,
                    'input_type': type(field_data).__name__
                }
            )
        elif field_type in self.field_map['file']:
            # Parent method calculates the length of the file instead of the filename,
            # we are changing it to calculate length of the file name
            file_field = field.parent.data.get(field.source, None)
            file_name_length = len(file_field.name) if file_field else 0
            kwargs.update(
                {
                    'max_length': field.max_length,
                    'length': file_name_length
                }
            )
        elif field_type in self.field_map['composite']:
            kwargs.update(
                {
                    'input_type': type(field_data).__name__,
                    'max_length': getattr(field, 'max_length', None),
                    'min_length': getattr(field, 'min_length', None)
                }
            )
        elif field_type in self.field_map['relation']:
            kwargs.update(
                {
                    'pk_value': field_data,
                    'data_type': type(field_data).__name__,
                    'input_type': type(field_data).__name__,
                    'slug_name': getattr(field, 'slug_field', None),
                    'value': field_data
                }
            )
        else:
            kwargs.update({'max_length': getattr(field, 'max_length', None)})
        return kwargs
