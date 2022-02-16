from sqlalchemy import DECIMAL as sa_decimal
from db.types import email, money, datetime, uri
from db.types.base import PostgresType


CUSTOM_TYPE_DICT = {
    # For some reason, SQLAlchemy doesn't add DECIMAL to the default
    # ischema_names supported by a PostgreSQL engine
    PostgresType.DECIMAL.value: sa_decimal,
    email.DB_TYPE: email.Email,
    money.DB_TYPE: money.MathesarMoney,
    datetime.TIME_ZONE_DB_TYPE: datetime.TIME_WITH_TIME_ZONE,
    datetime.WITHOUT_TIME_ZONE_DB_TYPE: datetime.TIME_WITHOUT_TIME_ZONE,
    datetime.TIMESTAMP_TIME_ZONE_DB_TYPE: datetime.TIMESTAMP_WITH_TIME_ZONE,
    datetime.TIMESTAMP_WITHOUT_TIME_ZONE_DB_TYPE: datetime.TIMESTAMP_WITHOUT_TIME_ZONE,
    uri.DB_TYPE: uri.URI
}
