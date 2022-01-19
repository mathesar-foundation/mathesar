from rest_framework.serializers import Serializer
from rest_framework.utils.serializer_helpers import ReturnList
from rest_framework_friendly_errors.mixins import FriendlyErrorMessagesMixin
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as RestValidationError
from mathesar.api.exceptions.exceptions import ExceptionBody


class MathesarErrorMessageMixin(FriendlyErrorMessagesMixin):
    def is_pretty(self, error):
        return isinstance(error, dict) and tuple(error.keys()) == ExceptionBody._fields

    def build_pretty_errors(self, errors, serializer=None):
        pretty = []
        for error_type in errors:
            error = errors[error_type]
            if error_type == 'non_field_errors':

                if self.is_pretty(error):
                    pretty.append(error)
                else:
                    pretty.extend(self.get_non_field_error_entries(
                            errors[error_type]))
            else:
                field = self.fields.fields[error_type]
                if isinstance(field, Serializer) and type(errors[error_type]) == dict:
                    field.initial_data = self.initial_data[error_type]
                    child_errors = field.build_pretty_errors(errors[error_type])
                    pretty += child_errors
                    continue
                if self.is_pretty(error):
                    if 'field' not in error or error['field'] is None or str(error['field']) == 'None':
                        error['field'] = error_type
                    pretty.append(error)
                else:
                    pretty.extend(
                            self.get_field_error_entries(errors[error_type], field),
                    )
        if pretty:
            return pretty
        return []

    def _run_validator(self, validator, field, message):
        try:
            args = []
            if getattr(validator, 'requires_context', False):
                args.append(field)
            validator(self.initial_data[field.field_name], *args)
        except (DjangoValidationError, RestValidationError) as err:
            err_message = err.detail[0] \
                if hasattr(err, 'detail') else err.message
            return err_message == message

    @property
    def errors(self):
        ugly_errors = super(FriendlyErrorMessagesMixin, self).errors
        pretty_errors = self.build_pretty_errors(ugly_errors)
        return ReturnList(pretty_errors, serializer=self)

    @property
    def field_map(self):
        return {
            'boolean': ['BooleanField', 'NullBooleanField'],
            'string': ['CharField', 'EmailField', 'RegexField', 'SlugField',
                       'URLField', 'UUIDField', 'FilePathField',
                       'IPAddressField'],
            'numeric': ['IntegerField', 'FloatField', 'DecimalField'],
            'date': {'DateTimeField': self.DATETIME_FORMAT,
                     'DateField': self.DATE_FORMAT,
                     'TimeField': self.TIME_FORMAT,
                     'DurationField': self.DURATION_FORMAT},
            'choice': ['ChoiceField', 'MultipleChoiceField'],
            'file': ['FileField', 'ImageField'],
            'composite': ['ListField', 'DictField', 'JSONField'],
            'relation': ['StringRelatedField', 'PrimaryKeyRelatedField',
                         'HyperlinkedRelatedField', 'SlugRelatedField',
                         'HyperlinkedIdentityField', 'ManyRelatedField', 'ListSerializer'],
            'miscellaneous': ['ReadOnlyField', 'HiddenField', 'ModelField',
                              'SerializerMethodField']
        }

    def get_field_kwargs(self, field, field_data):
        field_type = field.__class__.__name__
        kwargs = {
            'data_type': type(field_data).__name__
        }
        if field_type in self.field_map['boolean']:
            kwargs.update({'input': field_data})
        elif field_type in self.field_map['string']:
            kwargs.update({'max_length': getattr(field, 'max_length', None),
                           'min_length': getattr(field, 'min_length', None),
                           'value': field_data})
        elif field_type in self.field_map['numeric']:

            kwargs.update({'min_value': field.min_value,
                           'max_value': field.max_value,
                           'decimal_places': getattr(field, 'decimal_places',
                                                     None),
                           'max_decimal_places': getattr(field,
                                                         'decimal_places',
                                                         None),
                           'max_digits': getattr(field, 'max_digits', None)})
            max_digits = kwargs['max_digits']
            decimal_places = kwargs['decimal_places']
            if max_digits is not None and decimal_places is not None:
                whole_digits = max_digits - decimal_places
                kwargs.update({'max_whole_digits': whole_digits})
        elif field_type in self.field_map['date'].keys():
            kwargs.update({'format': self.field_map['date'][field_type]})
        elif field_type in self.field_map['choice']:
            kwargs.update({'input': field_data,
                           'input_type': type(field_data).__name__})
        elif field_type in self.field_map['file']:
            kwargs.update({'max_length': field.max_length,
                           'length': len(field.parent.data.get(
                                   field.source, '').name)})
        elif field_type in self.field_map['composite']:
            kwargs.update({'input_type': type(field_data).__name__,
                           'max_length': getattr(field, 'max_length', None),
                           'min_length': getattr(field, 'min_length', None)})
        elif field_type in self.field_map['relation']:
            kwargs.update({'pk_value': field_data,
                           'data_type': type(field_data).__name__,
                           'input_type': type(field_data).__name__,
                           'slug_name': getattr(field, 'slug_field', None),
                           'value': field_data})
        else:
            kwargs.update({'max_length': getattr(field, 'max_length', None)})
        return kwargs
