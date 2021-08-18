import warnings
from enum import Enum

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import MetaData, CheckConstraint, ForeignKeyConstraint, PrimaryKeyConstraint, UniqueConstraint, Table, select, and_
from sqlalchemy.dialects.postgresql import ExcludeConstraint


class ConstraintType(Enum):
    FOREIGN_KEY = 'foreignkey'
    PRIMARY_KEY = 'primary'
    UNIQUE = 'unique'
    CHECK = 'check'
    EXCLUDE = 'exclude'


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


def get_constraints_with_oids(engine, table_oid=None):
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


def get_column_constraints(column_index, table_oid, engine):
    metadata = MetaData()
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore", message="Did not recognize type")
        pg_constraint = Table("pg_constraint", metadata, autoload_with=engine)

    query = (
        select(pg_constraint)
        .where(and_(
            # 'conrelid' contains the table oid
            pg_constraint.c.conrelid == table_oid,
            # 'conkey' contains a list of the constrained column's indices
            # Here, we check if the column index appears in the conkey list
            pg_constraint.c.conkey.bool_op("&&")(f"{{{column_index + 1}}}")
        ))
    )

    with engine.begin() as conn:
        result = conn.execute(query).fetchall()
    return result


# Naming conventions for constraints follow standard Postgres conventions
# described in https://stackoverflow.com/a/4108266
convention = {
    "ix": '%(table_name)s_%(column_0_name)s_idx',
    "uq": '%(table_name)s_%(column_0_name)s_key',
    "ck": '%(table_name)s_%(column_0_name)s_check',
    "fk": '%(table_name)s_%(column_0_name)s_fkey',
    "pk": '%(table_name)s_%(column_0_name)s_pkey'
}


def get_constraint_name(constraint_type, table_name, column_0_name):
    data = {
        'table_name': table_name,
        'column_0_name': column_0_name
    }
    if constraint_type == ConstraintType.UNIQUE.value:
        return convention['uq'] % data
    if constraint_type == ConstraintType.FOREIGN_KEY.value:
        return convention['fk'] % data
    if constraint_type == ConstraintType.PRIMARY_KEY.value:
        return convention['pk'] % data
    if constraint_type == ConstraintType.CHECK.value:
        return convention['ck'] % data
    return None


def create_unique_constraint(table_name, schema, engine, columns, constraint_name=None):
    with engine.begin() as conn:
        metadata = MetaData(bind=engine, schema=schema, naming_convention=convention)
        opts = {
            'target_metadata': metadata
        }
        ctx = MigrationContext.configure(conn, opts=opts)
        op = Operations(ctx)
        op.create_unique_constraint(constraint_name, table_name, columns, schema)


def drop_constraint(table_name, schema, engine, constraint_name):
    with engine.begin() as conn:
        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)
        op.drop_constraint(constraint_name, table_name, schema=schema)


def copy_constraint(table, engine, constraint, from_column, to_column):
    constraint_type = get_constraint_type_from_char(constraint.contype)
    if constraint_type == ConstraintType.UNIQUE.value:
        column_idxs = [con - 1 for con in constraint.conkey]
        columns = [
            table.c[to_column if idx == from_column else idx].name
            for idx in column_idxs
        ]
        create_unique_constraint(table.name, table.schema, engine, columns)
    else:
        raise NotImplementedError
