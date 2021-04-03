from sqlalchemy import text
from mathesar.database.types import constants as c

EMAIL_SPEC_BASE = "email"
FULL_ADDRESS = "full_address"
USER_NAME = "user_name"
DOMAIN_NAME = "domain_name"
TEXT = "text"
EMAIL_COMPOSITE = {
    FULL_ADDRESS: TEXT,
    USER_NAME: TEXT,
    DOMAIN_NAME: TEXT,
}
EMAIL_REGEX_STR = (
    "'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    "[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)

def create_email_type(engine, type_schema=c.TYPE_SCHEMA):
    quoted_internal_type_name = f'"{type_schema}"."{EMAIL_SPEC_BASE}_internal"'
    quoted_type_name = f'"{type_schema}"."{EMAIL_SPEC_BASE}"'
    types_list = [f"{k} {v}" for k, v in EMAIL_COMPOSITE.items()]
    drop_type_query = f"""
    DROP TYPE IF EXISTS {quoted_internal_type_name};
    """
    create_type_query = f"""
    CREATE TYPE {quoted_internal_type_name} AS (
      {", ".join(types_list)}
    );
    """
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {quoted_type_name};
    """
    create_domain_query = f"""
    CREATE DOMAIN {quoted_type_name} AS {quoted_internal_type_name}
    CHECK (
      (value).{FULL_ADDRESS} ~ {EMAIL_REGEX_STR}
      AND split_part((value).{FULL_ADDRESS}, '@', 1) = (value).{USER_NAME}
      AND split_part((value).{FULL_ADDRESS}, '@', 2) = (value).{DOMAIN_NAME}
    );
    """
    print(create_domain_query)
    with engine.connect() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(drop_type_query))
        conn.execute(text(create_type_query))
        conn.execute(text(create_domain_query))
        conn.commit()
