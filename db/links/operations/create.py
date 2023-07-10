from sqlalchemy import ForeignKey, MetaData
from db.connection import execute_msar_func_with_engine

from db.columns.base import MathesarColumn
from db.constraints.utils import naming_convention
from db.tables.operations.create import create_mathesar_table
from db.tables.operations.select import reflect_tables_from_oids
from db.tables.utils import get_primary_key_column
from db.metadata import get_empty_metadata


def create_foreign_key_link(
        engine,
        referrer_column_name,
        referrer_table_oid,
        referent_table_oid,
        unique_link=False
):
    """
    Creates a Many-to-One or One-to-One link.

    Args:
        engine: SQLAlchemy engine object for connecting.
        referrer_column_name: Name of the new column to be created
                              in the referrer table.
        referrer_table_oid: The OID of the referrer table.
        referent_table_oid: The OID of the referent table.
        unique_link: Whether to make the link one-to-one
                     instead of many-to-one.

    Returns:
        Returns a string giving the command that was run.
    """
    return execute_msar_func_with_engine(
        engine,
        'add_many_to_one_link',
        referent_table_oid,
        referrer_table_oid,
        referrer_column_name,
        unique_link
    ).fetchone()[0]


def create_many_to_many_link(engine, schema, map_table_name, referents):
    with engine.begin() as conn:
        referent_tables_oid = [referent['referent_table'] for referent in referents]
        referent_tables = reflect_tables_from_oids(
            referent_tables_oid, engine, connection_to_use=conn, metadata=get_empty_metadata()
        )
        metadata = MetaData(bind=engine, schema=schema, naming_convention=naming_convention)
        # Throws sqlalchemy.exc.NoReferencedTableError if metadata is not reflected.
        metadata.reflect()
        referrer_columns = []
        for referent in referents:
            referent_table_oid = referent['referent_table']
            referent_table = referent_tables[referent_table_oid]
            col_name = referent['column_name']
            primary_key_column = get_primary_key_column(referent_table)
            foreign_keys = {ForeignKey(primary_key_column)}
            column = MathesarColumn(
                col_name, primary_key_column.type, foreign_keys=foreign_keys,
            )
            referrer_columns.append(column)
        create_mathesar_table(map_table_name, schema, referrer_columns, engine, metadata)
