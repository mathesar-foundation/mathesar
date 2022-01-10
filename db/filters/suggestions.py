from abc import ABC
from dataclasses import dataclass, field
from typing import List


# frozen=True provides immutability
def frozen_dataclass(f):
    return dataclass(frozen=True)(f)


def static(value):
    """
    Declares a static field on a dataclass.
    """
    return field(init=False, default=value)


@frozen_dataclass
class Suggestion(ABC):
    id: str


@frozen_dataclass
class ParameterCount(Suggestion):
    id: str = static("parameter_count")
    count: int


@frozen_dataclass
class Parameter(Suggestion):
    id: str = static("parameter")
    index: int
    suggestions: List[Suggestion]


@frozen_dataclass
class AllParameters(Suggestion):
    id: str = static("all_parameters")
    suggestions: List[Suggestion]


@frozen_dataclass
class Returns(Suggestion):
    id: str = static("returns")
    suggestions: List[Suggestion]


@frozen_dataclass
class Boolean(Suggestion):
    id: str = static("boolean")


@frozen_dataclass
class Comparable(Suggestion):
    id: str = static("comparable")


@frozen_dataclass
class Column(Suggestion):
    id: str = static("column")


@frozen_dataclass
class Array(Suggestion):
    id: str = static("array")


@frozen_dataclass
class StringLike(Suggestion):
    id: str = static("string_like")


@frozen_dataclass
class URI(Suggestion):
    id: str = static("uri")
