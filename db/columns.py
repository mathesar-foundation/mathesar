from sqlalchemy import Column, Integer
from db import constants


PRIMARY_KEY = "primary_key"
TYPE = "type"

DEFAULT_COLUMNS = {
    constants.ID: {TYPE: Integer, PRIMARY_KEY: True}
}


# TODO replicate ForeignKey wrangling from prototype
class MathesarColumn(Column):
    """
    This class constrains the possible arguments, enabling us to include a copy
    method (which has been deprecated in upstream SQLAlchemy since 1.4)
    """
    def __init__(self, name, sa_type, primary_key=False):
        super().__init__(name=name, type_=sa_type, primary_key=primary_key)

    @classmethod
    def from_column(cls, column):
        """
        This alternate init method creates a new column (a copy) of the given
        column.  It respects only the properties in the __init__ of the
        MathesarColumn.
        """
        return cls(column.name, column.type)

    def is_default(self):
        default_def = DEFAULT_COLUMNS.get(self.name, False)
        return (
            default_def
            and self.type.__class__ == default_def[TYPE]
            and self.primary_key == default_def[PRIMARY_KEY]
        )


def get_default_mathesar_column_list():
    return [
        MathesarColumn(
            c,
            DEFAULT_COLUMNS[c][TYPE],
            DEFAULT_COLUMNS[c][PRIMARY_KEY]
        )
        for c in DEFAULT_COLUMNS
    ]


def init_mathesar_table_column_list_with_defaults(column_list):
    default_columns = get_default_mathesar_column_list()
    given_columns = [MathesarColumn.from_column(c) for c in column_list]
    return default_columns + given_columns
