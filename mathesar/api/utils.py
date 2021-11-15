from rest_framework.exceptions import NotFound

from mathesar.models import Table


def get_table_or_404(pk):
    """
    Get table if it exists, otherwise throws a DRF NotFound error.
    Args:
        pk: id of table
    Returns:
        table: return the table based on a specific id
    """
    try:
        table = Table.objects.get(id=pk)
    except Table.DoesNotExist:
        raise NotFound
    return table


class ReadOnlyPolymorphicSerializerMappingMixin(object):
    def to_representation(self, instance):
        serializer = self.template_serializers.get(self.get_mapping_field(), None)
        if serializer is not None:
            return serializer(instance, context=self.context).to_representation(instance)
        else:
            raise Exception(f"Cannot find a matching serializer for the specified type {self.get_mapping_field()}")

    def get_mapping_field(self):
        mapping_field = getattr(self, "mapping_field", None)
        if mapping_field is None:
            # TODO replace this with a proper error message
            raise Exception("Add a `mapping_field` to be used as a identifier"
                            "or override this method to return a identifier to identify a proper serializer")
        return mapping_field


class ReadWritePolymorphicSerializerMappingMixin(ReadOnlyPolymorphicSerializerMappingMixin):
    def to_internal_value(self, data):
        serializer = self.template_serializers.get(self.get_mapping_field())
        if serializer is not None:
            self.__class__ = serializer
            return serializer(data=data, context=self.context).to_internal_value(
                data=data)
        else:
            raise Exception(f"Cannot find a matching serializer for the specified type {self.get_mapping_field()}")
