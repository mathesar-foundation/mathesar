import json
from abc import ABC, abstractmethod
from db.constraints.utils import (
    get_constraint_match_char_from_type, get_constraint_char_from_action
)


class Constraint(ABC):
    @abstractmethod
    def get_constraint_def_json(self):
        pass


class UniqueConstraint(Constraint):
    def __init__(self, name, table_oid, columns_attnum):
        self.name = name
        self.table_oid = table_oid
        self.columns_attnum = columns_attnum

    def get_constraint_def_json(self):
        return json.dumps(
            [
                {
                    'name': self.name,
                    'type': 'u',
                    'columns': self.columns_attnum
                }
            ],
        )


class ForeignKeyConstraint(Constraint):
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

    def get_constraint_def_json(self):
        match_type = get_constraint_match_char_from_type(self.options.get('match'))
        on_update = get_constraint_char_from_action(self.options.get('onupdate'))
        on_delete = get_constraint_char_from_action(self.options.get('ondelete'))
        return json.dumps(
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