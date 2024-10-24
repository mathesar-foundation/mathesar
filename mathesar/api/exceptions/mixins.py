from rest_framework.serializers import ListSerializer, Serializer
from rest_framework.utils.serializer_helpers import ReturnList
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as RestValidationError
from mathesar.api.exceptions.generic_exceptions.base_exceptions import ErrorBody
from mathesar.api.exceptions.error_codes import FRIENDLY_FIELD_ERRORS, FRIENDLY_VALIDATOR_ERRORS


class MathesarErrorMessageMixin():

    FIELD_VALIDATION_ERRORS = {}
    NON_FIELD_ERRORS = {}

    def __init__(self, *args, **kwargs):
        self.registered_errors = {}
        super(MathesarErrorMessageMixin, self).__init__(*args, **kwargs)

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
            scalar_errors = dict(map(lambda item: (item[0], item[1][0] if type(item[1]) is list else item[1]), errors.items()))
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
                if isinstance(field, Serializer) and type(errors[error_type]) is dict:
                    field.initial_data = self.initial_data[error_type]
                    child_errors = field.build_pretty_errors(errors[error_type])
                    pretty += child_errors
                    continue
                if isinstance(field, ListSerializer) and type(errors[error_type]) is list:
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

    @property
    def errors(self):
        """
        This method build on top of `errors` property of the superclass to return a list instead of a dictionary
        """
        ugly_errors = super(MathesarErrorMessageMixin, self).errors
        pretty_errors = self.build_pretty_errors(ugly_errors)
        return ReturnList(pretty_errors, serializer=self)

    @property
    def field_map(self):
        parent_field_map = {
            'boolean': ['BooleanField', 'NullBooleanField'],
            'string': ['CharField', 'EmailField', 'RegexField', 'SlugField',
                       'URLField', 'UUIDField', 'FilePathField',
                       'IPAddressField'],
            'numeric': ['IntegerField', 'FloatField', 'DecimalField'],
            'date': {'DateTimeField': 'YYYY-MM-DDThh:mm[:ss[.uuuuuu]][+HH:MM|-HH:MM|Z]',
                     'DateField': 'YYYY[-MM[-DD]]',
                     'TimeField': 'hh:mm[:ss[.uuuuuu]]',
                     'DurationField': '[DD] [HH:[MM:]]ss[.uuuuuu]'},
            'choice': ['ChoiceField', 'MultipleChoiceField'],
            'file': ['FileField', 'ImageField'],
            'composite': ['ListField', 'DictField', 'JSONField'],
            'relation': ['StringRelatedField', 'PrimaryKeyRelatedField',
                         'HyperlinkedRelatedField', 'SlugRelatedField',
                         'HyperlinkedIdentityField', 'ManyRelatedField',
                         'ListSerializer', 'PermittedPkRelatedField',
                         'PermittedSlugRelatedField'],
            'miscellaneous': ['ReadOnlyField', 'HiddenField', 'ModelField',
                              'SerializerMethodField']
        }
        return parent_field_map

    def register_error(self, error_message, field_name=None,
                       error_key=None, error_code=None):
        if field_name is None:
            if error_code is None:
                raise ValueError('For non field error you must provide '
                                 'an error code')
            error = {'code': error_code, 'message': error_message,
                     'field': None}
        else:
            field_instance = self.fields.get(field_name)
            if field_instance is None:
                raise ValueError('Incorrect field name')
            field_type = field_instance.__class__.__name__
            if error_key is None and error_code is None:
                raise ValueError('You have to provide either error key'
                                 ' or error code')
            if error_code is not None:
                error_code = error_code
            else:
                try:
                    error_code = FRIENDLY_FIELD_ERRORS[field_type].get(
                        error_key)
                except KeyError:
                    raise ValueError('Unknown field type: "%s"' % field_type)
                if error_code is None:
                    raise ValueError('Unknown error key: "%s" '
                                     'for field type: "%s"' %
                                     (error_key, field_type))
            error = {'code': error_code, 'field': field_name,
                     'message': error_message}
        key = '%s_%s_%s' % (error_message, error_code, field_name)
        self.registered_errors[key] = error
        raise RestValidationError(key)

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

    def does_not_exist_many_to_many_handler(self, field, message, kwargs):
        unformatted = field.error_messages['does_not_exist']
        new_kwargs = kwargs
        for value in kwargs['value']:
            new_kwargs['value'] = value
            if unformatted.format(**new_kwargs) == message:
                return True
        return False

    def find_key(self, field, message, field_name):
        kwargs = self.get_field_kwargs(
            field, self.initial_data.get(field_name)
        )
        for key in field.error_messages:
            if key == 'does_not_exist' \
                and isinstance(kwargs.get('value'), list) \
                and self.does_not_exist_many_to_many_handler(
                    field, message, kwargs):
                return key
            unformatted = field.error_messages[key]
            if unformatted.format(**kwargs) == message:
                return key
        if getattr(field, 'child_relation', None):
            return self.find_key(field=field.child_relation, message=message,
                                 field_name=field_name)
        return None

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
            if hasattr(err, 'detail'):
                err_message = err.detail[0]
            elif hasattr(err, 'message'):
                err_message = err.message
            elif hasattr(err, 'messages'):
                err_message = err.messages[0]
            return err_message == message

    def find_validator(self, field, message):
        for validator in field.validators:
            if self._run_validator(validator, field, message):
                return validator

    def get_field_error_entry(self, error, field):
        if error in self.registered_errors:
            return self.registered_errors[error]
        field_type = field.__class__.__name__
        key = self.find_key(field, error, field.field_name)
        if not key:
            # Here we know that error was raised by a custom field validator
            validator = self.find_validator(field, error)
            if validator:
                try:
                    name = validator.__name__
                except AttributeError:
                    name = validator.__class__.__name__
                code = self.FIELD_VALIDATION_ERRORS.get(name) or FRIENDLY_VALIDATOR_ERRORS.get(name)
                return {'code': code,
                        'field': field.field_name,
                        'message': error}
            # Here we know that error was raised by custom validate method
            # in serializer
            validator = getattr(self, "validate_%s" % field.field_name)
            if self._run_validator(validator, field, error):
                name = validator.__name__
                code = self.FIELD_VALIDATION_ERRORS.get(name) or FRIENDLY_VALIDATOR_ERRORS.get(name)
                return {'code': code, 'field': field.field_name,
                        'message': error}
        return {'code': FRIENDLY_FIELD_ERRORS.get(
                field_type, {}).get(key),
                'field': field.field_name,
                'message': error}

    def get_field_error_entries(self, errors, field):
        return [self.get_field_error_entry(error, field) for error in errors]

    def get_non_field_error_entry(self, error):
        if error in self.registered_errors:
            return self.registered_errors[error]

        if 'Invalid data. Expected a dictionary, but got {data_type}.'.format(
                data_type=type(self.initial_data).__name__) == error:
            return {'code': 1001,
                    'field': None,
                    'message': error}
        code = self.NON_FIELD_ERRORS.get(error)
        return {'code': code, 'field': None, 'message': error}

    def get_non_field_error_entries(self, errors):
        return [self.get_non_field_error_entry(error) for error in errors]
