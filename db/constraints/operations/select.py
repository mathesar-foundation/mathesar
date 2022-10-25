from db.utils import get_pg_catalog_table
from db.metadata import get_empty_metadata

from sqlalchemy import select, and_


def get_constraints_with_oids(engine, table_oid=None):
    # TODO reuse metadata
    metadata = get_empty_metadata()
    pg_constraint = get_pg_catalog_table("pg_constraint", engine, metadata=metadata)
    # conrelid is the table's OID.
    if table_oid:
        where_clause = pg_constraint.c.conrelid == table_oid
    else:
        # We only want to select constraints attached to a table.
        where_clause = pg_constraint.c.conrelid != 0
    query = select(pg_constraint).where(where_clause)
    with engine.begin() as conn:
        result = conn.execute(query).fetchall()
    return result


def get_constraint_from_oid(oid, engine, table):
    constraint_record = get_constraint_record_from_oid(oid, engine)
    for constraint in table.constraints:
        if constraint.name == constraint_record['conname']:
            return constraint
    return None


def get_constraint_record_from_oid(oid, engine):
    metadata = get_empty_metadata()
    pg_constraint = get_pg_catalog_table("pg_constraint", engine, metadata=metadata)
    # conrelid is the table's OID.
    query = select(pg_constraint).where(pg_constraint.c.oid == oid)
    with engine.begin() as conn:
        constraint_record = conn.execute(query).first()
    return constraint_record


def get_constraint_oid_by_name_and_table_oid(name, table_oid, engine):
    # TODO reuse metadata
    metadata = get_empty_metadata()
    pg_constraint = get_pg_catalog_table("pg_constraint", engine, metadata=metadata)
    # We only want to select constraints attached to a table.
    # conrelid is the table's OID.
    query = select(pg_constraint).where(
        and_(pg_constraint.c.conrelid == table_oid, pg_constraint.c.conname == name)
    )
    with engine.begin() as conn:
        result = conn.execute(query).first()
    return result['oid']


def get_fkey_constraint_oid_by_name_and_referent_table_oid(name, table_oid, engine):
    """
    Sometimes, we need to find a foreign key by the referent table OID.
    """
    # TODO reuse metadata
    metadata = get_empty_metadata()
    pg_constraint = get_pg_catalog_table("pg_constraint", engine, metadata=metadata)
    # We only want to select constraints attached to a table.
    # confrelid is the referent table's OID.
    query = select(pg_constraint).where(
        and_(pg_constraint.c.confrelid == table_oid, pg_constraint.c.conname == name)
    )
    with engine.begin() as conn:
        result = conn.execute(query).first()
    return result['oid']


def get_column_constraints(column_attnum, table_oid, engine):
    # TODO reuse metadata
    metadata = get_empty_metadata()
    pg_constraint = get_pg_catalog_table("pg_constraint", engine, metadata=metadata)
    query = (
        select(pg_constraint)
        .where(and_(
            # 'conrelid' contains the table oid
            pg_constraint.c.conrelid == table_oid,
            # 'conkey' contains a list of the constrained column's attnum
            # Here, we check if the column attnum appears in the conkey list
            pg_constraint.c.conkey.bool_op("&&")(f"{{{column_attnum}}}")
        ))
    )
    with engine.begin() as conn:
        result = conn.execute(query).fetchall()
    return result
