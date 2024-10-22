from sqlalchemy import NUMERIC
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType
from db.types.custom.underlying_type import HasUnderlyingType

DB_TYPE = MathesarCustomType.MATHESAR_MONEY.id


class MathesarMoney(UserDefinedType, HasUnderlyingType):
    underlying_type = NUMERIC

    def get_col_spec(self, **_):
        return DB_TYPE.upper()
