from sqlalchemy import Column, ForeignKey, inspect

from db.columns.defaults import TYPE, PRIMARY_KEY, NULLABLE, DEFAULT_COLUMNS
from db.columns.operations.select import (
    get_column_attnum_from_name, get_column_default, get_column_default_dict,
)
from db.tables.operations.select import get_oid_from_table
from db.types.operations.cast import get_full_cast_map
from db.types.operations.convert import get_db_type_enum_from_class


# TODO consider renaming to DbColumn or DatabaseColumn
# We are attempting to reserve the term Mathesar for types in the mathesar namespace.
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
            foreign_keys=set(),
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

    def to_sa_column(self):
        """
        MathesarColumn sometimes is not interchangeable with SQLAlchemy's Column.
        For use in those situations, this method attempts to recreate an SA Column.

        NOTE: this method is incomplete: it does not account for all properties of MathesarColumn.
        """
        sa_column = Column(name=self.name, type_=self.type)
        sa_column.table = self.table_
        return sa_column

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
            oid = get_oid_from_table(
                self.table_.name, self.table_.schema, self.engine
            )
        else:
            oid = None
        return oid

    @property
    def is_default(self):
        default_def = DEFAULT_COLUMNS.get(self.name, False)
        return (
            default_def
            and self.type.python_type == default_def[TYPE]().python_type
            and self.primary_key == default_def.get(PRIMARY_KEY, False)
            and self.nullable == default_def.get(NULLABLE, True)
        )

    def add_engine(self, engine):
        self.engine = engine

    @property
    def valid_target_types(self):
        """
        Returns a set of valid types to which the type of the column can be
        altered.
        """
        if (
            self.engine is not None
            and not self.is_default
            and self.db_type is not None
        ):
            db_type = self.db_type
            valid_target_types = sorted(
                list(
                    set(
                        get_full_cast_map(self.engine).get(db_type, [])
                    )
                ),
                key=lambda db_type: db_type.id
            )
            return valid_target_types if valid_target_types else None

    @property
    def column_attnum(self):
        """
        Get the attnum of this column in its table, if it is
        attached to a table that is associated with the column's engine.
        """
        engine_exists = self.engine is not None
        table_exists = self.table_ is not None
        engine_has_table = inspect(self.engine).has_table(self.table_.name, schema=self.table_.schema)
        if engine_exists and table_exists and engine_has_table:
            return get_column_attnum_from_name(
                self.table_oid,
                self.name,
                self.engine
            )

    @property
    def column_default_dict(self):
        if self.table_ is None:
            return
        default_dict = get_column_default_dict(
            self.table_oid, self.column_attnum, self.engine
        )
        if default_dict:
            return {
                'is_dynamic': default_dict['is_dynamic'],
                'value': default_dict['value']
            }

    @property
    def default_value(self):
        if self.table_ is not None:
            return get_column_default(self.table_oid, self.column_attnum, self.engine)

    @property
    def db_type(self):
        """
        Get this column's database type enum.
        """
        self._assert_that_engine_is_present()
        return get_db_type_enum_from_class(self.type.__class__)

    @property
    def type_options(self):
        full_type_options = {
            "length": getattr(self.type, "length", None),
            "precision": getattr(self.type, "precision", None),
            "scale": getattr(self.type, "scale", None),
            "fields": getattr(self.type, "fields", None),
        }
        _type_options = {k: v for k, v in full_type_options.items() if v is not None}
        return _type_options if _type_options else None

    def _assert_that_engine_is_present(self):
        if self.engine is None:
            raise Exception("Engine should not be None.")
