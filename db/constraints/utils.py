from enum import Enum

from sqlalchemy import CheckConstraint, ForeignKeyConstraint, PrimaryKeyConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import ExcludeConstraint

from db.columns.operations.select import get_column_name_from_attnum
from db.tables.operations.select import reflect_table_from_oid


class ConstraintType(Enum):
    FOREIGN_KEY = 'foreignkey'
    PRIMARY_KEY = 'primary'
    UNIQUE = 'unique'
    CHECK = 'check'
    EXCLUDE = 'exclude'


# Naming conventions for constraints follow standard Postgres conventions
# described in https://stackoverflow.com/a/4108266
naming_convention = {
    "ix": '%(table_name)s_%(column_0_name)s_idx',
    "uq": '%(table_name)s_%(column_0_name)s_key',
    "ck": '%(table_name)s_%(column_0_name)s_check',
    "fk": '%(table_name)s_%(column_0_name)s_fkey',
    "pk": '%(table_name)s_%(column_0_name)s_pkey'
}


def get_constraint_type_from_class(constraint):
    if type(constraint) == CheckConstraint:
        return ConstraintType.CHECK.value
    elif type(constraint) == ForeignKeyConstraint:
        return ConstraintType.FOREIGN_KEY.value
    elif type(constraint) == PrimaryKeyConstraint:
        return ConstraintType.PRIMARY_KEY.value
    elif type(constraint) == UniqueConstraint:
        return ConstraintType.UNIQUE.value
    elif type(constraint) == ExcludeConstraint:
        return ConstraintType.EXCLUDE.value
    return None


def get_constraint_type_from_char(constraint_char):
    if constraint_char == "c":
        return ConstraintType.CHECK.value
    elif constraint_char == "f":
        return ConstraintType.FOREIGN_KEY.value
    elif constraint_char == "p":
        return ConstraintType.PRIMARY_KEY.value
    elif constraint_char == "u":
        return ConstraintType.UNIQUE.value
    elif constraint_char == "x":
        return ConstraintType.EXCLUDE.value
    return None


def get_constraint_name(engine, constraint_type, table_oid, column_0_attnum, connection_to_use=None):
    table_name = reflect_table_from_oid(table_oid, engine, connection_to_use=connection_to_use).name
    column_0_name = get_column_name_from_attnum(table_oid, column_0_attnum, engine, connection_to_use)
    data = {
        'table_name': table_name,
        'column_0_name': column_0_name
    }
    if constraint_type == ConstraintType.UNIQUE.value:
        return naming_convention['uq'] % data
    if constraint_type == ConstraintType.FOREIGN_KEY.value:
        return naming_convention['fk'] % data
    if constraint_type == ConstraintType.PRIMARY_KEY.value:
        return naming_convention['pk'] % data
    if constraint_type == ConstraintType.CHECK.value:
        return naming_convention['ck'] % data
    return None
