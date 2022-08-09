from abc import ABC, abstractmethod

import sqlalchemy
import sqlalchemy_filters
from sqlalchemy import select

from db.functions.operations import apply
from db.records.operations import group, relevance


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

    def __eq__(self, other):
        return (
            type(self) is type(other)
            and self.__dict__ == other.__dict__
        )


class Filter(Transform):
    type = "filter"

    def apply_to_relation(self, relation):
        filter = self.spec
        enforce_relation_type_expectations(relation)
        executable = _to_executable(relation)
        if filter is not None:
            executable = apply.apply_db_function_spec_as_filter(executable, filter)
        return _to_non_executable(executable)


class Order(Transform):
    type = "order"

    def apply_to_relation(self, relation):
        order_by = self.spec
        enforce_relation_type_expectations(relation)
        executable = _to_executable(relation)
        if order_by is not None:
            executable = sqlalchemy_filters.apply_sort(executable, order_by)
        return _to_non_executable(executable)


class Limit(Transform):
    type = "limit"

    def apply_to_relation(self, relation):
        limit = self.spec
        executable = _to_executable(relation)
        executable = executable.limit(limit)
        return _to_non_executable(executable)


class Offset(Transform):
    type = "offset"

    def apply_to_relation(self, relation):
        offset = self.spec
        executable = _to_executable(relation)
        executable = executable.offset(offset)
        return _to_non_executable(executable)


class DuplicateOnly(Transform):
    type = "duplicate_only"

    def apply_to_relation(self, relation):
        duplicate_columns = self.spec
        enforce_relation_type_expectations(relation)
        DUPLICATE_LABEL = "_is_dupe"
        duplicate_flag_col = (
            sqlalchemy.func
            .count(1)
            .over(partition_by=duplicate_columns) > 1
        ).label(DUPLICATE_LABEL)
        duplicate_flag_cte = (
            select(
                *relation.c,
                duplicate_flag_col,
            ).select_from(relation)
        ).cte()
        executable = (
            select(duplicate_flag_cte)
            .where(duplicate_flag_cte.c[DUPLICATE_LABEL])
        )
        return _to_non_executable(executable)


class Search(Transform):
    type = "search"
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
    type = "group"

    def apply_to_relation(self, relation):
        group_by = self.spec
        # TODO maybe keep this as json, and convert to GroupBy at last moment?
        # other transform specs are json at this point in the pipeline
        if isinstance(group_by, group.GroupBy):
            executable = group.get_group_augmented_records_pg_query(relation, group_by)
            return _to_non_executable(executable)
        else:
            return relation


class Summarize(Transform):
    type = "summarize"

    def apply_to_relation(self, relation):
        grouping_expressions = [
            apply.get_sa_expression_from_db_function_spec(col_spec)
            for col_spec in self.spec.get("grouping_expressions", [])
        ]
        aggregation_expressions = [
            apply.get_sa_expression_from_db_function_spec(col_spec)
            for col_spec in self.spec["aggregation_expressions"]
        ]

        executable = (
            select(*grouping_expressions, *aggregation_expressions)
            .group_by(*grouping_expressions)
            .select_from(relation)
        )
        return _to_non_executable(executable)


class SelectSubsetOfColumns(Transform):
    type = "select"

    def apply_to_relation(self, relation):
        columns_to_select = self.spec
        if columns_to_select:
            processed_columns_to_select = [
                _make_sure_column_expression(column)
                for column
                in columns_to_select
            ]
            executable = select(*processed_columns_to_select).select_from(relation)
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
