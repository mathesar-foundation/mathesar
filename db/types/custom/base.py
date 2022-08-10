from db.types.custom import datetime, email, money, multicurrency, uri, char, json_object, json_array
from db.types.base import PostgresType, MathesarCustomType

from frozendict import frozendict

# Mapping of database type enums to SQLAlchemy classes. Primarily to be added to the SA ischema_names dict.
CUSTOM_DB_TYPE_TO_SA_CLASS = frozendict(
    {
        PostgresType.INTERVAL: datetime.Interval,
        MathesarCustomType.EMAIL: email.Email,
        MathesarCustomType.MULTICURRENCY_MONEY: multicurrency.MulticurrencyMoney,
        MathesarCustomType.MATHESAR_MONEY: money.MathesarMoney,
        PostgresType.CHAR: char.CHAR,
        PostgresType.DATE: datetime.DATE,
        PostgresType.TIME_WITH_TIME_ZONE: datetime.TIME_WITH_TIME_ZONE,
        PostgresType.TIME_WITHOUT_TIME_ZONE: datetime.TIME_WITHOUT_TIME_ZONE,
        PostgresType.TIMESTAMP_WITH_TIME_ZONE: datetime.TIMESTAMP_WITH_TIME_ZONE,
        PostgresType.TIMESTAMP_WITHOUT_TIME_ZONE: datetime.TIMESTAMP_WITHOUT_TIME_ZONE,
        MathesarCustomType.URI: uri.URI,
        MathesarCustomType.MATHESAR_JSON_OBJECT: json_object.MathesarJsonObject,
        MathesarCustomType.MATHESAR_JSON_ARRAY: json_array.MathesarJsonArray,
    }
)
