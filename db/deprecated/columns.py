# TODO Remove this file once explorations are in the database
from sqlalchemy import Column, ForeignKey, inspect, and_, asc, select

from db.deprecated.utils import execute_statement, get_pg_catalog_table
from db.deprecated.tables import reflect_table_from_oid
from db.deprecated.types.convert import get_db_type_enum_from_class


class MathesarColumn(Column):
    """
    This class constrains the possible arguments, enabling us to include
    a copy method (which has been deprecated in upstream SQLAlchemy since
    1.4).  The idea is that we can faithfully copy the subset of the
    column definition that we care about, and this class defines that
    subset.
    """

    def __init__(
            self,
            name,
            sa_type,
            foreign_keys=None,
            primary_key=False,
            nullable=True,
            autoincrement=False,
            server_default=None,
            engine=None,
    ):
        """
        Construct a new ``MathesarColumn`` object.

        Required arguments:
        name -- String giving the name of the column in the database.
        sa_type -- the SQLAlchemy type of the column.

        Optional keyword arguments:
        primary_key -- Boolean giving whether the column is a primary key.
        nullable -- Boolean giving whether the column is nullable.
        server_default -- String or DefaultClause giving the default value
        """
        if foreign_keys is None:
            foreign_keys = set()
        self.engine = engine
        super().__init__(
            *foreign_keys,
            name=name,
            type_=sa_type,
            primary_key=primary_key,
            nullable=nullable,
            autoincrement=autoincrement,
            server_default=server_default
        )
        # NOTE: For some reason, sometimes `self._proxies` is a tuple. SA expects it to be
        # appendable, however. Was not able to track down the source of it. As a workaround, we
        # convert it into a list here. I (Dom) offer a bounty of bragging rights to anyone who
        # figures out what's causing `_proxies` to be tuples.
        if isinstance(self._proxies, tuple):
            self._proxies = list(self._proxies)

    @classmethod
    def _constructor(cls, *args, **kwargs):
        """
        Needed to support Column.copy().

        See https://docs.sqlalchemy.org/en/14/changelog/changelog_07.html?highlight=_constructor#change-de8c32a6729c83da17177f6a13979717
        """
        return MathesarColumn.from_column(
            Column(*args, **kwargs)
        )

    @classmethod
    def from_column(cls, column, engine=None):
        """
        This alternate init method creates a new column (a copy) of the
        given column.  It respects only the properties in the __init__
        of the MathesarColumn.
        """
        try:
            fkeys = {ForeignKey(fk.target_fullname) for fk in column.foreign_keys}
            new_column = cls(
                column.name,
                column.type,
                foreign_keys=fkeys,
                primary_key=column.primary_key,
                nullable=column.nullable,
                autoincrement=column.autoincrement,
                server_default=column.server_default,
                engine=engine,
            )
            new_column.original_table = column.table
        # dirty hack to handle cases where this isn't a real column
        except AttributeError:
            new_column = cls(
                column.name,
                column.type,
                engine=engine,
            )
        return new_column

    @property
    def table_(self):
        """
        Returns the current table the column is associated with if it exists, otherwise
        returns the table the column was originally created from.
        """
        if hasattr(self, "table") and self.table is not None:
            return self.table
        elif hasattr(self, "original_table") and self.original_table is not None:
            return self.original_table
        return None

    @property
    def table_oid(self):
        if self.table_ is not None:
            oid = inspect(self.engine).get_table_oid(
                self.table_.name, schema=self.table_.schema
            )
        else:
            oid = None
        return oid

    def add_engine(self, engine):
        self.engine = engine

    @property
    def column_attnum(self):
        """
        Get the attnum of this column in its table, if it is
        attached to a table that is associated with the column's engine.
        """
        engine_exists = self.engine is not None
        table_exists = self.table_ is not None
        engine_has_table = inspect(self.engine).has_table(
            self.table_.name,
            schema=self.table_.schema,
        )
        if engine_exists and table_exists and engine_has_table:
            metadata = self.table_.metadata
            return get_column_attnum_from_name(
                self.table_oid,
                self.name,
                self.engine,
                metadata=metadata,
            )

    @property
    def db_type(self):
        """
        Get this column's database type enum.
        """
        self._assert_that_engine_is_present()
        return get_db_type_enum_from_class(self.type.__class__)

    @property
    def type_options(self):
        item_type = getattr(self.type, "item_type", None)
        if item_type is not None:
            item_type_name = get_db_type_enum_from_class(item_type.__class__).id
        else:
            item_type_name = None
        full_type_options = {
            "length": getattr(self.type, "length", None),
            "precision": getattr(self.type, "precision", None),
            "scale": getattr(self.type, "scale", None),
            "fields": getattr(self.type, "fields", None),
            "item_type": item_type_name,
            "dimensions": getattr(self.type, "dimensions", None)
        }
        _type_options = {k: v for k, v in full_type_options.items() if v is not None}
        return _type_options if _type_options else None

    def _assert_that_engine_is_present(self):
        if self.engine is None:
            raise Exception("Engine should not be None.")


def get_column_obj_from_relation(relation, column):
    """
    This function can look for anything that's reasonably referred to as
    a column, such as MathesarColumns, SA Columns, or just a column name
    string in the given relation
    """
    try:
        column = _find_column_by_name_in_relation(relation, column)
    except AttributeError:
        column = relation.columns[column.name]

    return column


def _find_column_by_name_in_relation(relation, col_name_string):
    """
    Because we may have to look for the column by a name with an
    inappropriate namespacing (i.e., there may be an errant table or
    schema attached), we iteratively peel any possible namespace off the
    front of the column name string at each call.
    """
    try:
        return relation.columns[col_name_string]
    except KeyError:
        col_name_split = col_name_string.split(sep='.', maxsplit=1)
        if len(col_name_split) <= 1:
            raise KeyError(col_name_string)
        else:
            return _find_column_by_name_in_relation(relation, col_name_split[-1])


def get_primary_key_column_collection_from_relation(relation):
    """
    This logic is needed since some "relations" have a primary_key
    attribute that has a column attribute that is a ColumnCollection
    subtype, whereas some relations have a primary_key attribute that is
    itself a ColumnCollection subtype.

    If there is no primary key in the relation, we return NoneType
    """
    pkey = getattr(relation, 'primary_key', None)
    pk_cols = getattr(pkey, 'columns', pkey)
    return pk_cols


def get_column_attnum_from_name(table_oid, column_name, engine, metadata, connection_to_use=None):
    statement = _get_columns_attnum_from_names(table_oid, [column_name], engine=engine, metadata=metadata)
    return execute_statement(engine, statement, connection_to_use).scalar()


def _get_columns_attnum_from_names(table_oid, column_names, engine, metadata):
    pg_attribute = get_pg_catalog_table("pg_attribute", engine=engine, metadata=metadata)
    sel = select(pg_attribute.c.attnum, pg_attribute.c.attname).where(
        and_(
            pg_attribute.c.attrelid == table_oid,
            pg_attribute.c.attname.in_(column_names)
        )
    ).order_by(asc(pg_attribute.c.attnum))
    return sel


def get_column_from_oid_and_attnum(table_oid, attnum, engine, metadata, connection_to_use=None):
    sa_table = reflect_table_from_oid(table_oid, engine, metadata=metadata, connection_to_use=connection_to_use)
    column_name = get_column_name_from_attnum(table_oid, attnum, engine, metadata=metadata, connection_to_use=connection_to_use)
    sa_column = sa_table.columns[column_name]
    return sa_column


def get_column_name_from_attnum(table_oid, attnum, engine, metadata, connection_to_use=None):
    statement = _statement_for_triples_of_column_name_and_attnum_and_table_oid(
        [table_oid], [attnum], engine, metadata=metadata,
    )
    column_name = execute_statement(engine, statement, connection_to_use).scalar()
    return column_name


def _statement_for_triples_of_column_name_and_attnum_and_table_oid(
    table_oids, attnums, engine, metadata
):
    """
    Returns (column name, column attnum, column table's oid) tuples for each column that's in the
    tables specified via `table_oids`, and, when `attnums` is not None, that has an attnum
    specified in `attnums`.

    The order is based on the column order in the table and not on the order of the arguments.
    """
    pg_attribute = get_pg_catalog_table("pg_attribute", engine, metadata=metadata)
    sel = select(pg_attribute.c.attname, pg_attribute.c.attnum, pg_attribute.c.attrelid)
    wasnt_dropped = pg_attribute.c.attisdropped.is_(False)
    table_oid_matches = pg_attribute.c.attrelid.in_(table_oids)
    conditions = [wasnt_dropped, table_oid_matches]
    if attnums is not None:
        attnum_matches = pg_attribute.c.attnum.in_(attnums)
        conditions.append(attnum_matches)
    else:
        attnum_positive = pg_attribute.c.attnum > 0
        conditions.append(attnum_positive)
    sel = sel.where(and_(*conditions))
    return sel
