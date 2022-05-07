from alembic.operations import Operations
from alembic.migration import MigrationContext
from sqlalchemy import MetaData

from db.columns.base import MathesarColumn
from db.constraints.utils import naming_convention
from db.tables.operations.select import reflect_table_from_oid, reflect_tables_from_oids
from db.tables.utils import get_primary_key_column


def create_foreign_key_link(engine, schema, column_name, referrer_table_oid, referent_table_oid, unique_link=False):
    with engine.begin() as conn:
        referent_table = reflect_table_from_oid(referent_table_oid, engine, conn)
        referrer_table = reflect_table_from_oid(referrer_table_oid, engine, conn)
        primary_key_column = get_primary_key_column(referent_table)
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(conn, opts=opts)
        op = Operations(ctx)
        column = MathesarColumn(
            column_name, primary_key_column.type
        )
        op.add_column(referrer_table.name, column, schema=schema)
        if unique_link:
            op.create_unique_constraint(None, referrer_table.name, [column_name], schema=schema)
        op.create_foreign_key(
            None,
            referrer_table.name,
            referent_table.name,
            [column.name],
            [primary_key_column.name],
            source_schema=schema,
            referent_schema=schema
        )


def create_many_to_many_link(engine, schema, map_table_name, referent_tables_oid):
    with engine.begin() as conn:
        referent_tables = reflect_tables_from_oids(referent_tables_oid, engine, conn)
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(conn, opts=opts)
        op = Operations(ctx)
        op.create_table(map_table_name, schema=schema)
        for index, referent_table_oid in enumerate(referent_tables):
            referent_table = referent_tables[referent_table_oid]
            col_name = f"col_{index}"
            primary_key_column = get_primary_key_column(referent_table)
            column = MathesarColumn(
                col_name, primary_key_column.type
            )
            op.add_column(map_table_name, column, schema=schema)
            op.create_foreign_key(
                None,
                map_table_name,
                referent_table.name,
                [column.name],
                [primary_key_column.name],
                source_schema=schema,
                referent_schema=schema
            )
