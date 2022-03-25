from db.types.custom import datetime, email, money, multicurrency, uri
from db.types.base import PostgresType, MathesarCustomType

from frozendict import frozendict


CUSTOM_TYPE_DICT = frozendict(
    {
        db_type.id: sa_class
        for db_type, sa_class
        in {
            PostgresType.INTERVAL: datetime.Interval,
            MathesarCustomType.EMAIL: email.Email,
            MathesarCustomType.MULTICURRENCY_MONEY: multicurrency.MulticurrencyMoney,
            MathesarCustomType.MATHESAR_MONEY: money.MathesarMoney,
            PostgresType.DATE: datetime.DATE,
            PostgresType.TIME_WITH_TIME_ZONE: datetime.TIME_WITH_TIME_ZONE,
            PostgresType.TIME_WITHOUT_TIME_ZONE: datetime.TIME_WITHOUT_TIME_ZONE,
            PostgresType.TIMESTAMP_WITH_TIME_ZONE: datetime.TIMESTAMP_WITH_TIME_ZONE,
            PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: datetime.TIMESTAMP_WITHOUT_TIME_ZONE,
            MathesarCustomType.URI: uri.URI
        }.items()
    }
)
