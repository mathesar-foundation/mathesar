"""TODO: This needs to be consolidated with db.constraints.operations.create."""

from abc import ABC, abstractmethod
import json

from db.connection import execute_msar_func_with_engine
from db.constraints.utils import (
    get_constraint_match_char_from_type, get_constraint_char_from_action
)


class Constraint(ABC):

    @abstractmethod
    def add_constraint(self, schema, engine, connection_to_use):
        pass

    @abstractmethod
    def constraint_type(self):
        pass


class ForeignKeyConstraint(Constraint):
    def constraint_type(self):
        return "foreignkey"

    def __init__(
            self, name,
            table_oid,
            columns_attnum,
            referent_table_oid,
            referent_columns_attnum,
            options
    ):
        self.name = name
        self.table_oid = table_oid
        self.columns_attnum = columns_attnum
        self.referent_table_oid = referent_table_oid
        self.referent_columns = referent_columns_attnum
        self.options = options

    def add_constraint(self, schema, engine, connection_to_use):
        match_type = get_constraint_match_char_from_type(self.options.get('match'))
        on_update = get_constraint_char_from_action(self.options.get('onupdate'))
        on_delete = get_constraint_char_from_action(self.options.get('ondelete'))
        return execute_msar_func_with_engine(
            engine,
            'add_constraints',
            self.table_oid,
            json.dumps(
                [
                    {
                        'name': self.name,
                        'type': 'f',
                        'columns': self.columns_attnum,
                        'deferrable': self.options.get('deferrable'),
                        'fkey_relation_id': self.referent_table_oid,
                        'fkey_columns': self.referent_columns,
                        'fkey_update_action': on_update,
                        'fkey_delete_action': on_delete,
                        'fkey_match_type': match_type,
                    }
                ]
            )
        ).fetchone()[0]


class UniqueConstraint(Constraint):

    def __init__(self, name, table_oid, columns_attnum):
        self.name = name
        self.table_oid = table_oid
        self.columns_attnum = columns_attnum

    def add_constraint(self, schema, engine, connection_to_use):
        return execute_msar_func_with_engine(
            engine,
            'add_constraints',
            self.table_oid,
            json.dumps(
                [
                    {
                        'name': self.name,
                        'type': 'u',
                        'columns': self.columns_attnum
                    }
                ],
            )
        ).fetchone()[0]

    def constraint_type(self):
        return "unique"
