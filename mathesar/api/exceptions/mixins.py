from rest_framework.utils.serializer_helpers import ReturnList
from rest_framework_friendly_errors.mixins import FriendlyErrorMessagesMixin

from mathesar.api.exceptions.exceptions import ExceptionBody


class MathesarErrorMessageMixin(FriendlyErrorMessagesMixin):
    def is_pretty(self, error):
        return isinstance(error, dict) and tuple(error.keys()) == ExceptionBody._fields

    def build_pretty_errors(self, errors):

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
                field = self.fields[error_type]
                if self.is_pretty(error):
                    if 'field' not in error or error['field'] is None:
                        error['field'] = error_type
                    pretty.append(error)
                else:
                    pretty.extend(
                            self.get_field_error_entries(errors[error_type], field),
                    )
        if pretty:
            return pretty
        return []

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
