"""Utilities for database constraints."""
from enum import Enum


class ConstraintType(Enum):
    FOREIGN_KEY = 'foreignkey'
    PRIMARY_KEY = 'primary'
    UNIQUE = 'unique'
    CHECK = 'check'
    EXCLUDE = 'exclude'


class ConstraintAction(Enum):
    RESTRICT = 'RESTRICT'
    CASCADE = 'CASCADE'
    SET_NULL = 'SET NULL'
    NO_ACTION = 'NO ACTION'
    SET_DEFAULT = 'SET DEFAULT'


class ConstraintMatch(Enum):
    FULL = 'FULL'
    PARTIAL = 'PARTIAL'
    SIMPLE = 'SIMPLE'


# TODO Remove this. It's incorrect, and not robust.
# Naming conventions for constraints follow standard Postgres conventions
# described in https://stackoverflow.com/a/4108266
naming_convention = {
    "ix": '%(table_name)s_%(column_0_name)s_idx',
    "uq": '%(table_name)s_%(column_0_name)s_key',
    "ck": '%(table_name)s_%(column_0_name)s_check',
    "fk": '%(table_name)s_%(column_0_name)s_fkey',
    "pk": '%(table_name)s_%(column_0_name)s_pkey'
}


def get_constraint_type_from_char(constraint_char):
    """
    Map the char for a constraint to the string used for creating it in SQL.

    Args:
        constraint_char: Single character, matching pg_constraints.

    Returns:
        The string used for creating the constraint in SQL.
    """
    char_type_map = {
        "c": ConstraintType.CHECK.value,
        "f": ConstraintType.FOREIGN_KEY.value,
        "p": ConstraintType.PRIMARY_KEY.value,
        "u": ConstraintType.UNIQUE.value,
        "x": ConstraintType.EXCLUDE.value
    }
    return char_type_map.get(constraint_char)


def _get_char_action_map(reverse=False):
    action_map = {
        "a": ConstraintAction.NO_ACTION.value,
        "r": ConstraintAction.RESTRICT.value,
        "c": ConstraintAction.CASCADE.value,
        "n": ConstraintAction.SET_NULL.value,
        "d": ConstraintAction.SET_DEFAULT.value,
    }
    if reverse:
        action_map = {v: k for k, v in action_map.items()}
    return action_map


def get_constraint_action_from_char(action_char):
    """
    Map the action_char to a string giving the on update or on delecte action.

    Args:
        action_char: Single character, matching pg_constraints.
    """
    action_map = _get_char_action_map()
    return action_map.get(action_char)


def get_constraint_char_from_action(action):
    """
    Map the on update or on delete action to a single character.

    Args:
        action: Single character, matching pg_constraints.
    """
    action_map = _get_char_action_map(reverse=True)
    return action_map.get(action)


def _get_char_match_map(reverse=False):
    match_map = {
        "f": ConstraintMatch.FULL.value,
        "p": ConstraintMatch.PARTIAL.value,
        "s": ConstraintMatch.SIMPLE.value,
    }
    if reverse:
        match_map = {v: k for k, v in match_map.items()}
    return match_map


def get_constraint_match_type_from_char(match_char):
    """
    Map the match_char to a string giving the match type.

    Args:
        match_char: Single character, matching pg_constraints.
    """
    match_map = _get_char_match_map()
    return match_map.get(match_char)


def get_constraint_match_char_from_type(match_type):
    """
    Map the match_type to a single character.

    Args:
        match_type: Single character, matching pg_constraints.
    """
    match_map = _get_char_match_map(reverse=True)
    return match_map.get(match_type)
