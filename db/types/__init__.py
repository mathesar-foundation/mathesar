from sqlalchemy import DECIMAL as sa_decimal
from sqlalchemy import CHAR as sa_char
from db.types import datetime, email, money, multicurrency, uri
from db.types.base import PostgresType


CUSTOM_TYPE_DICT = {
    # For some reason, SQLAlchemy doesn't add DECIMAL to the default
    # ischema_names supported by a PostgreSQL engine
    PostgresType.DECIMAL.value: sa_decimal,
    PostgresType.INTERVAL.value: datetime.Interval,
    PostgresType.MATHESAR_CHAR.value: sa_char,
    email.DB_TYPE: email.Email,
    multicurrency.DB_TYPE: multicurrency.MulticurrencyMoney,
    money.DB_TYPE: money.MathesarMoney,
    datetime.DATE_TYPE: datetime.DATE,
    datetime.TIME_ZONE_DB_TYPE: datetime.TIME_WITH_TIME_ZONE,
    datetime.WITHOUT_TIME_ZONE_DB_TYPE: datetime.TIME_WITHOUT_TIME_ZONE,
    datetime.TIMESTAMP_TIME_ZONE_DB_TYPE: datetime.TIMESTAMP_WITH_TIME_ZONE,
    datetime.TIMESTAMP_WITHOUT_TIME_ZONE_DB_TYPE: datetime.TIMESTAMP_WITHOUT_TIME_ZONE,
    uri.DB_TYPE: uri.URI
}
