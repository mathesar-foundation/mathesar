import warnings

from sqlalchemy import MetaData, Table, select, and_


def get_constraints_with_oids(engine, table_oid=None):
    # TODO reuse metadata
    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_constraint = Table("pg_constraint", metadata, autoload_with=engine)
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
    # TODO reuse metadata
    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_constraint = Table("pg_constraint", metadata, autoload_with=engine)
        # conrelid is the table's OID.
        query = select(pg_constraint).where(pg_constraint.c.oid == oid)
    with engine.begin() as conn:
        constraint_record = conn.execute(query).first()
    for constraint in table.constraints:
        if constraint.name == constraint_record['conname']:
            return constraint
    return None


def get_constraint_oid_by_name_and_table_oid(name, table_oid, engine):
    # TODO reuse metadata
    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_constraint = Table("pg_constraint", metadata, autoload_with=engine)
        # We only want to select constraints attached to a table.
        # conrelid is the table's OID.
        query = select(pg_constraint).where(and_(pg_constraint.c.conrelid == table_oid, pg_constraint.c.conname == name))
    with engine.begin() as conn:
        result = conn.execute(query).first()
    return result['oid']


def get_column_constraints(column_attnum, table_oid, engine):
    # TODO reuse metadata
    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_constraint = Table("pg_constraint", metadata, autoload_with=engine)

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
