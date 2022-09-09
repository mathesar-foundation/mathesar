from abc import ABC, abstractmethod

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import MetaData

from db.columns.operations.select import get_columns_name_from_attnums
from db.constraints.utils import naming_convention
from db.tables.operations.select import reflect_table_from_oid
from db.metadata import get_empty_metadata


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
        # TODO reuse metadata
        metadata = get_empty_metadata()
        table = reflect_table_from_oid(self.table_oid, engine, connection_to_use=connection_to_use, metadata=metadata)
        referent_table = reflect_table_from_oid(self.referent_table_oid, engine, connection_to_use=connection_to_use, metadata=metadata)
        columns_name = get_columns_name_from_attnums(self.table_oid, self.columns_attnum, engine=engine, connection_to_use=connection_to_use, metadata=metadata)
        referent_columns_name = get_columns_name_from_attnums(
            self.referent_table_oid,
            self.referent_columns,
            engine=engine,
            connection_to_use=connection_to_use,
            metadata=metadata,
        )
        # TODO reuse metadata
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(connection_to_use, opts=opts)
        op = Operations(ctx)
        op.create_foreign_key(
            self.name,
            table.name,
            referent_table.name,
            columns_name,
            referent_columns_name,
            source_schema=table.schema,
            referent_schema=referent_table.schema,
            **self.options
        )


class UniqueConstraint(Constraint):

    def __init__(self, name, table_oid, columns_attnum):
        self.name = name
        self.table_oid = table_oid
        self.columns_attnum = columns_attnum

    def add_constraint(self, schema, engine, connection_to_use):
        # TODO reuse metadata
        metadata = get_empty_metadata()
        table = reflect_table_from_oid(self.table_oid, engine, connection_to_use=connection_to_use, metadata=metadata)
        columns = get_columns_name_from_attnums(self.table_oid, self.columns_attnum, engine=engine, connection_to_use=connection_to_use, metadata=metadata)
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(connection_to_use, opts=opts)
        op = Operations(ctx)
        op.create_unique_constraint(self.name, table.name, columns, table.schema)

    def constraint_type(self):
        return "unique"
