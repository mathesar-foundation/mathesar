from sqlalchemy import text, create_engine
from sqlalchemy.types import UserDefinedType
from mathesar.database.types import constants as c

preparer = create_engine("postgresql://").dialect.identifier_preparer

EMAIL_SPEC_BASE = "email"
QUOTED_TYPE_NAME = ".".join(
    [preparer.quote_schema(c.TYPE_SCHEMA), preparer.quote(EMAIL_SPEC_BASE)]
)
QUOTED_INTERNAL_TYPE_NAME = ".".join(
    [
        preparer.quote_schema(c.TYPE_SCHEMA),
        preparer.quote(EMAIL_SPEC_BASE) + "_internal"
    ]
)

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

class Email(UserDefinedType):
    # TODO Finish implementation of input/output parsers
    def get_col_spec(self, **kw):
        return QUOTED_TYPE_NAME


def create_email_type(engine):
    types_list = [f"{k} {v}" for k, v in EMAIL_COMPOSITE.items()]
    drop_type_query = f"""
    DROP TYPE IF EXISTS {QUOTED_INTERNAL_TYPE_NAME};
    """
    create_type_query = f"""
    CREATE TYPE {QUOTED_INTERNAL_TYPE_NAME} AS (
      {", ".join(types_list)}
    );
    """
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {QUOTED_TYPE_NAME};
    """
    create_domain_query = f"""
    CREATE DOMAIN {QUOTED_TYPE_NAME} AS {QUOTED_INTERNAL_TYPE_NAME}
    CHECK (
      (value).{FULL_ADDRESS} ~ {EMAIL_REGEX_STR}
      AND split_part((value).{FULL_ADDRESS}, '@', 1) = (value).{USER_NAME}
      AND split_part((value).{FULL_ADDRESS}, '@', 2) = (value).{DOMAIN_NAME}
    );
    """
    with engine.connect() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(drop_type_query))
        conn.execute(text(create_type_query))
        conn.execute(text(create_domain_query))
        conn.commit()
