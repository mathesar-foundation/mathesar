from sqlalchemy import DECIMAL as sa_decimal
from db.types import email
from db.types.alteration import DECIMAL

CUSTOM_TYPE_DICT = {
    # For some reason, SQLAlchemy doesn't add DECIMAL to the default
    # ischema_names supported by a PostgreSQL engine
    DECIMAL: sa_decimal,
    email.QUALIFIED_EMAIL: email.Email,
}
