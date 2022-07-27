from abc import ABC, abstractmethod
from enum import Enum

import sqlalchemy
import sqlalchemy_filters
from sqlalchemy import select

from db.functions.operations.apply import apply_db_function_spec_as_filter
from db.records.operations import group, relevance


# NOTE, that information provided by this Enum is duplicated in the concrete Transform
# subclasses, because each of them already has a type. Enum does provide assurance
# that ids are not duplicated, but that's not obviously useful. Enum also provides
# a centralized location for knowing what types there are, but that's pretty much
# solved by the `known_transforms` construct. Keeping this Enum around for the faint
# benefit of having a plain list of legal transform types, but author doesn't consider
# this Enum integral, and it can be refactored away.
class TransformType(Enum):
    """
    Enumerates transformation types.
    """
    FILTER = "filter"
    ORDER = "order"
    LIMIT = "limit"
    OFFSET = "offset"
    SELECT = "select"
    DUPLICATE_ONLY = "duplicate_only"
    SEARCH = "search"
    GROUP = "group"
    SELECT_SUBSET_OF_COLUMNS = "select"

    @property
    def id(self):
        """
        Here we're defining Enum's value attribute to be the transform id.
        """
        return self.value


class Transform(ABC):
    type = None
    spec = None

    def __init__(
        self,
        spec
    ):
        if self.type is None:
            raise ValueError(
                'Transform subclasses must define a type.'
            )
        if spec is None:
            raise ValueError(
                'A spec must be passed when instantiating a Transform subclass.'
            )
        self.spec = spec

    @abstractmethod
    def apply_to_relation(self, relation):
        return None


class Filter(Transform):
    type = TransformType.FILTER

    def apply_to_relation(self, relation):
        filter = self.spec
        enforce_relation_type_expectations(relation)
        executable = _to_executable(relation)
        if filter is not None:
            executable = apply_db_function_spec_as_filter(executable, filter)
        return _to_non_executable(executable)


class Order(Transform):
    type = TransformType.ORDER

    def apply_to_relation(self, relation):
        order_by = self.spec
        enforce_relation_type_expectations(relation)
        executable = _to_executable(relation)
        if order_by is not None:
            executable = sqlalchemy_filters.apply_sort(executable, order_by)
        return _to_non_executable(executable)


class Limit(Transform):
    type = TransformType.LIMIT

    def apply_to_relation(self, relation):
        limit = self.spec
        executable = _to_executable(relation)
        executable = executable.limit(limit)
        return _to_non_executable(executable)


class Offset(Transform):
    type = TransformType.OFFSET

    def apply_to_relation(self, relation):
        offset = self.spec
        executable = _to_executable(relation)
        executable = executable.offset(offset)
        return _to_non_executable(executable)


class DuplicateOnly(Transform):
    type = TransformType.DUPLICATE_ONLY

    def apply_to_relation(self, relation):
        duplicate_columns = self.spec
        enforce_relation_type_expectations(relation)
        DUPLICATE_LABEL = "_is_dupe"
        duplicate_flag_cte = (
            select(
                *relation.c,
                (
                    sqlalchemy.func
                    .count(1)
                    .over(partition_by=duplicate_columns) > 1
                ).label(DUPLICATE_LABEL),
            ).select_from(relation)
        ).cte()
        executable = (
            select(duplicate_flag_cte)
            .where(duplicate_flag_cte.c[DUPLICATE_LABEL])
        )
        return _to_non_executable(executable)


class Search(Transform):
    type = TransformType.SEARCH
    spec = []

    @property
    def search_spec(self):
        return self.spec[0]

    @property
    def limit_spec(self):
        return self.spec[1]

    def apply_to_relation(self, relation):
        search = self.search_spec
        limit = self.limit_spec
        search_params = {search_obj['column']: search_obj['literal'] for search_obj in search}
        executable = relevance.get_rank_and_filter_rows_query(relation, search_params, limit)
        return _to_non_executable(executable)


class Group(Transform):
    type = TransformType.GROUP

    def apply_to_relation(self, relation):
        group_by = self.spec
        # TODO maybe keep this as json, and convert to GroupBy at last moment?
        # other transform specs are json at this point in the pipeline
        if isinstance(group_by, group.GroupBy):
            executable = group.get_group_augmented_records_pg_query(relation, group_by)
            return _to_non_executable(executable)
        else:
            relation


class SelectSubsetOfColumns(Transform):
    type = TransformType.SELECT_SUBSET_OF_COLUMNS

    def apply_to_relation(self, relation):
        columns_to_select = self.spec
        if columns_to_select:
            executable = _to_executable(relation)
            processed_columns_to_select = tuple(
                _make_sure_column_expression(column)
                for column
                in columns_to_select
            )
            executable = select(*processed_columns_to_select).select_from(executable)
            return _to_non_executable(executable)
        else:
            return relation


def _make_sure_column_expression(input):
    if isinstance(input, str):
        return sqlalchemy.column(input)
    else:
        return input


def _to_executable(relation):
    """
    Executables are a subset of Selectables.
    """
    assert isinstance(relation, sqlalchemy.sql.expression.Selectable)
    if isinstance(relation, sqlalchemy.sql.expression.Executable):
        return relation
    else:
        return select(relation)


def _to_non_executable(relation):
    """
    Non-executables are Selectables that are not Executables. Non-executables are more portable
    than Executables.
    """
    assert isinstance(relation, sqlalchemy.sql.expression.Selectable)
    if isinstance(relation, sqlalchemy.sql.expression.Executable):
        return relation.cte()
    else:
        return relation


def enforce_relation_type_expectations(relation):
    """
    The convention being enforced is to pass around instances of Selectables that are not
    Executables. We need to do it one way, for the sake of uniformity and compatibility.
    It's not the other way around, because if you pass around Executables, composition sometimes
    works differently.

    This method is a development tool mostly, probably shouldn't exist in actual production.
    """
    assert isinstance(relation, sqlalchemy.sql.expression.Selectable)
    assert not isinstance(relation, sqlalchemy.sql.expression.Executable)


def get_transform_type_enum_from_id(transform_type_id):
    """
    Gets an instance of either the PostgresType enum or the MathesarCustomType enum corresponding
    to the provided db_type_id. If the id doesn't correspond to any of the mentioned enums,
    returns None.

    Input id is case insensitive.
    """
    transform_type_id = transform_type_id.lower()
    try:
        return TransformType(transform_type_id)
    except ValueError:
        return None
