import collections
import time
from logging import getLogger

import django
from django.db import models
from django.db.models import query
from django.db.models.fields.related_descriptors import ForwardManyToOneDescriptor

__version__ = '1.2.3'

logger = getLogger(__name__)


class PrefetchManagerMixin(models.Manager):
    use_for_related_fields = True
    prefetch_definitions = {}

    @classmethod
    def get_queryset_class(cls):
        return PrefetchQuerySet

    def __init__(self):
        super(PrefetchManagerMixin, self).__init__()
        for name, prefetcher in self.prefetch_definitions.items():
            if prefetcher.__class__ is not Prefetcher and not callable(prefetcher):
                raise InvalidPrefetch("Invalid prefetch definition %s. This prefetcher needs to be a class not an instance." % name)

    def get_queryset(self):
        qs = self.get_queryset_class()(
            self.model, prefetch_definitions=self.prefetch_definitions
        )

        if getattr(self, '_db', None) is not None:
            qs = qs.using(self._db)
        return qs

    def prefetch(self, *args):
        return self.get_queryset().prefetch(*args)


class PrefetchManager(PrefetchManagerMixin):
    def __init__(self, **kwargs):
        self.prefetch_definitions = kwargs
        super(PrefetchManager, self).__init__()


class PrefetchIterable(query.ModelIterable):
    def __iter__(self):
        data = list(super(PrefetchIterable, self).__iter__())
        for name, (forwarders, prefetcher) in self.queryset._prefetch.items():
            prefetcher.fetch(data, name, self.queryset.model, forwarders,
                             getattr(self.queryset, '_db', None))
        return iter(data)


class InvalidPrefetch(Exception):
    pass


class PrefetchOption(object):
    def __init__(self, name, *args, **kwargs):
        self.name = name
        self.args = args
        self.kwargs = kwargs


P = PrefetchOption


class PrefetchQuerySet(query.QuerySet):
    def __init__(self, model=None, query=None, using=None,
                 prefetch_definitions=None, **kwargs):
        super(PrefetchQuerySet, self).__init__(model, query, using, **kwargs)
        self._prefetch = {}
        self.prefetch_definitions = prefetch_definitions
        self._iterable_class = PrefetchIterable

    if django.VERSION < (2, 0):
        def _clone(self, **kwargs):
            return super(PrefetchQuerySet, self). \
                _clone(_prefetch=self._prefetch,
                       prefetch_definitions=self.prefetch_definitions, **kwargs)
    else:
        def _clone(self):
            c = super(PrefetchQuerySet, self)._clone()
            c._prefetch = self._prefetch
            c.prefetch_definitions = self.prefetch_definitions
            return c

    def prefetch(self, *names):
        obj = self._clone()

        for opt in names:
            if isinstance(opt, PrefetchOption):
                name = opt.name
            else:
                name = opt
                opt = None
            parts = name.split('__')
            forwarders = []
            prefetcher = None
            model = self.model
            prefetch_definitions = self.prefetch_definitions

            for what in parts:
                if not prefetcher:
                    if what in prefetch_definitions:
                        prefetcher = prefetch_definitions[what]
                        continue
                    descriptor = getattr(model, what, None)
                    if isinstance(descriptor, ForwardManyToOneDescriptor):
                        field = descriptor.field
                        forwarders.append(field.name)
                        model = field.remote_field.model
                        manager = model.objects
                        if not isinstance(manager, PrefetchManagerMixin):
                            raise InvalidPrefetch('Manager for %s is not a PrefetchManagerMixin instance.' % model)
                        prefetch_definitions = manager.prefetch_definitions
                    else:
                        raise InvalidPrefetch("Invalid part %s in prefetch call for %s on model %s. "
                                              "The name is not a prefetcher nor a forward relation (fk)." % (
                                                  what, name, self.model))
                else:
                    raise InvalidPrefetch("Invalid part %s in prefetch call for %s on model %s. "
                                          "You cannot have any more relations after the prefetcher." % (
                                              what, name, self.model))
            if not prefetcher:
                raise InvalidPrefetch("Invalid prefetch call with %s for on model %s. "
                                      "The last part isn't a prefetch definition." % (name, self.model))
            if opt:
                if prefetcher.__class__ is Prefetcher:
                    raise InvalidPrefetch("Invalid prefetch call with %s for on model %s. "
                                          "This prefetcher (%s) needs to be a subclass of Prefetcher." % (
                                              name, self.model, prefetcher))

                obj._prefetch[name] = forwarders, prefetcher(*opt.args, **opt.kwargs)
            else:
                obj._prefetch[name] = forwarders, prefetcher if prefetcher.__class__ is Prefetcher else prefetcher()

        for forwarders, prefetcher in obj._prefetch.values():
            if forwarders:
                obj = obj.select_related('__'.join(forwarders))
        return obj

    def iterator(self):
        return self._iterable_class(self)


class Prefetcher(object):
    """
    Prefetch definitition. For convenience you can either subclass this and
    define the methods on the subclass or just pass the functions to the
    contructor.

    Eg, subclassing::

        class GroupPrefetcher(Prefetcher):

            @staticmethod
            def filter(ids):
                return User.groups.through.objects.filter(user__in=ids).select_related('group')

            @staticmethod
            def reverse_mapper(user_group_association):
                return [user_group_association.user_id]

            @staticmethod
            def decorator(user, user_group_associations=()):
                setattr(user, 'prefetched_groups', [i.group for i in user_group_associations])

    Or with contructor::

        Prefetcher(
            filter = lambda ids: User.groups.through.objects.filter(user__in=ids).select_related('group'),
            reverse_mapper = lambda user_group_association: [user_group_association.user_id],
            decorator = lambda user, user_group_associations=(): setattr(user, 'prefetched_groups', [
                i.group for i in user_group_associations
            ])
        )


    Glossary:

    * filter(list_of_ids):

        A function that returns a queryset containing all the related data for a given list of keys.
        Takes a list of ids as argument.

    * reverse_mapper(related_object):

        A function that takes the related object as argument and returns a list
        of keys that maps that related object to the objects in the queryset.

    * mapper(object):

        Optional (defaults to ``lambda obj: obj.pk``).

        A function that returns the key for a given object in your query set.

    * decorator(object, list_of_related_objects):

        A function that will save the related data on each of your objects in
        your queryset. Takes the object and a list of related objects as
        arguments. Note that you should not override existing attributes on the
        model instance here.

    """
    collect = False

    def __init__(self, filter=None, reverse_mapper=None, decorator=None, mapper=None, collect=None):
        if filter:
            self.filter = filter
        elif not hasattr(self, 'filter'):
            raise RuntimeError("You must define a filter function")

        if reverse_mapper:
            self.reverse_mapper = reverse_mapper
        elif not hasattr(self, 'reverse_mapper'):
            raise RuntimeError("You must define a reverse_mapper function")

        if decorator:
            self.decorator = decorator
        elif not hasattr(self, 'decorator'):
            raise RuntimeError("You must define a decorator function")

        if mapper:
            self.mapper = mapper

        if collect is not None:
            self.collect = collect

    @staticmethod
    def mapper(obj):
        return obj.pk

    def fetch(self, dataset, name, model, forwarders, db):
        collect = self.collect or forwarders

        try:
            data_mapping = collections.defaultdict(list)
            t1 = time.time()
            for obj in dataset:
                for field in forwarders:
                    obj = getattr(obj, field, None)

                if not obj:
                    continue

                if collect:
                    data_mapping[self.mapper(obj)].append(obj)
                else:
                    data_mapping[self.mapper(obj)] = obj

            t2 = time.time()
            logger.debug("Creating data_mapping for %s query took %.3f secs for the %s prefetcher.",
                         model.__name__, t2 - t1, name)
            t1 = time.time()
            related_data = self.filter(data_mapping.keys(), data_mapping.values())
            related_data_len = len(related_data)
            t2 = time.time()
            logger.debug("Filtering for %s related objects for %s query took %.3f secs for the %s prefetcher.",
                         related_data_len, model.__name__, t2 - t1, name)
            relation_mapping = collections.defaultdict(list)

            t1 = time.time()
            if isinstance(related_data, dict):
                relation_mapping = related_data
            else:
                for obj in related_data:
                    for id_ in self.reverse_mapper(obj):
                        if id_:
                            relation_mapping[id_].append(obj)
            for id_, related_items in relation_mapping.items():
                if id_ in data_mapping:
                    if collect:
                        for item in data_mapping[id_]:
                            self.decorator(item, related_items)
                    else:
                        self.decorator(data_mapping[id_], related_items)

            t2 = time.time()
            logger.debug("Adding the related objects on the %s query took %.3f secs for the %s prefetcher.",
                         model.__name__, t2 - t1, name)
            return dataset
        except Exception:
            logger.exception("Prefetch failed for %s prefetch on the %s model:", name, model.__name__)
            raise
