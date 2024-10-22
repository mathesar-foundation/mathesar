from sqlalchemy import TEXT
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType
from db.types.custom.underlying_type import HasUnderlyingType

DB_TYPE = MathesarCustomType.EMAIL.id

EMAIL_DOMAIN_NAME = DB_TYPE + "_domain_name"


class Email(UserDefinedType, HasUnderlyingType):
    underlying_type = TEXT

    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()
