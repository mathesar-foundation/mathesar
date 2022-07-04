import requests

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.errors import URLNotReachable, URLInvalidContentTypeError
from mathesar.models.base import DataFile

SUPPORTED_URL_CONTENT_TYPES = {'text/csv', 'text/plain'}


class DataFileSerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        default=serializers.CurrentUserDefault(), read_only=True
    )
    header = serializers.BooleanField(default=True)
    paste = serializers.CharField(required=False, trim_whitespace=False)
    url = serializers.URLField(required=False)

    class Meta:
        model = DataFile
        fields = [
            'id', 'file', 'table_imported_to', 'user', 'header', 'delimiter',
            'escapechar', 'quotechar', 'paste', 'url', 'created_from'
        ]
        extra_kwargs = {
            'file': {'required': False},
            'delimiter': {'trim_whitespace': False},
            'escapechar': {'trim_whitespace': False},
            'quotechar': {'trim_whitespace': False}
        }
        # We only currently support importing to a new table, so setting a table via API is invalid.
        # User should be set automatically, not submitted via the API.
        read_only_fields = ['user', 'table_imported_to', 'created_from']
        write_only_fields = ['paste', 'url']

    def save(self, **kwargs):
        """
        Set user to current user while saving the data file.
        """
        current_user = self.fields['user'].get_default()
        if current_user.is_authenticated:
            kwargs['user'] = current_user
        return super().save(**kwargs)

    def validate(self, data):
        if not self.partial:
            # Only perform validation on source files when we're not partial
            source_fields = ['file', 'paste', 'url']
            present_fields = [field for field in source_fields if field in data]
            if len(present_fields) > 1:
                raise ValidationError(
                    f'Multiple source fields passed: {present_fields}.'
                    f' Only one of {source_fields} should be specified.'
                )
            elif len(present_fields) == 0:
                raise ValidationError(
                    f'One of {source_fields} should be specified.'
                )
        return data

    def validate_url(self, url):
        try:
            response = requests.head(url, allow_redirects=True)
        except requests.exceptions.ConnectionError:
            raise URLNotReachable

        content_type = response.headers.get('content-type')
        if content_type not in SUPPORTED_URL_CONTENT_TYPES:
            raise URLInvalidContentTypeError(content_type)
        return url
