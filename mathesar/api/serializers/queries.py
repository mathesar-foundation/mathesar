from django.core.exceptions import ValidationError
from django.urls import reverse
from django.db.models import Q

from rest_access_policy import PermittedPkRelatedField
from rest_framework import serializers

from mathesar.api.db.permissions.query_table import QueryTableAccessPolicy
from mathesar.api.exceptions.mixins import MathesarErrorMessageMixin
from mathesar.api.exceptions.validation_exceptions.exceptions import DuplicateUIQueryInSchemaAPIException
from mathesar.models.base import Table
from mathesar.models.query import UIQuery


class BaseQuerySerializer(MathesarErrorMessageMixin, serializers.ModelSerializer):
    schema = serializers.SerializerMethodField('get_schema')
    base_table = PermittedPkRelatedField(
        access_policy=QueryTableAccessPolicy,
        queryset=Table.current_objects.all()
    )

    class Meta:
        model = UIQuery
        fields = ['schema', 'initial_columns', 'transformations', 'base_table', 'display_names']

    def get_schema(self, uiquery):
        base_table = uiquery.base_table
        if base_table:
            return base_table.schema.id

    def validate(self, attrs):
        unexpected_fields = set(self.initial_data) - set(self.fields)
        if unexpected_fields:
            raise ValidationError(f"Unexpected field(s): {unexpected_fields}")
        self._validate_uniqueness(attrs)
        return attrs

    def _validate_uniqueness(self, attrs):
        """
        Uniqueness is only defined when both name and base_table are defined.

        Would be nice to define this in terms of Django's UniqueConstraint, but that doesn't seem
        possible, due to schema being a child property of base_table.
        """
        name = attrs.get('name')
        if name:
            base_table = attrs.get('base_table')
            if base_table:
                schema = base_table.schema
                is_duplicate_q = self._get_is_duplicate_q(name, schema)
                duplicates = UIQuery.objects.filter(is_duplicate_q)
                if duplicates.exists():
                    raise DuplicateUIQueryInSchemaAPIException(field='name')

    def _get_is_duplicate_q(self, name, schema):
        has_same_name_q = Q(name=name)
        has_same_schema_q = Q(base_table__schema=schema)
        is_duplicate_q = has_same_name_q & has_same_schema_q
        is_update = self.instance is not None
        if is_update:
            # If this is an update, filter self out of found duplicates
            id = self.instance.id
            is_not_this_instance_q = ~Q(id=id)
            is_duplicate_q = is_duplicate_q & is_not_this_instance_q
        return is_duplicate_q


class QuerySerializer(BaseQuerySerializer):
    results_url = serializers.SerializerMethodField('get_results_url')
    records_url = serializers.SerializerMethodField('get_records_url')
    columns_url = serializers.SerializerMethodField('get_columns_url')

    class Meta:
        model = UIQuery
        fields = '__all__'

    def get_records_url(self, obj):
        if isinstance(obj, UIQuery) and obj.pk is not None:
            # Only get records_url if we are serializing an existing persisted UIQuery
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-records', kwargs={'pk': obj.pk}))
        else:
            return None

    def get_columns_url(self, obj):
        if isinstance(obj, UIQuery) and obj.pk is not None:
            # Only get columns_url if we are serializing an existing persisted UIQuery
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-columns', kwargs={'pk': obj.pk}))
        else:
            return None

    def get_results_url(self, obj):
        if isinstance(obj, UIQuery) and obj.pk is not None:
            # Only get records_url if we are serializing an existing persisted UIQuery
            request = self.context['request']
            return request.build_absolute_uri(reverse('query-results', kwargs={'pk': obj.pk}))
        else:
            return None
