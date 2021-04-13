from sqlalchemy import text, create_engine, func, Text, cast
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from mathesar.database.types import constants as c

preparer = create_engine("postgresql://").dialect.identifier_preparer

EMAIL_SPEC_BASE = "email"
QUOTED_TYPE_NAME = ".".join(
    [preparer.quote_schema(c.TYPE_SCHEMA), preparer.quote(EMAIL_SPEC_BASE)]
)
EMAIL_DOMAIN_NAME = ".".join(
    [
        preparer.quote_schema(c.TYPE_SCHEMA),
        preparer.quote(EMAIL_SPEC_BASE + "_domain_name")
    ]
)
EMAIL_LOCAL_PART = ".".join(
    [
        preparer.quote_schema(c.TYPE_SCHEMA),
        preparer.quote(EMAIL_SPEC_BASE + "_local_part")
    ]
)

EMAIL_REGEX_STR = (
    "'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    "[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)

class Email(UserDefinedType):
    def get_col_spec(self, **kw):
        return QUOTED_TYPE_NAME


class email_domain_name(GenericFunction):
    type = Text
    name = quoted_name(EMAIL_DOMAIN_NAME, False)
    identifier = "email_domain_name"


class email_local_part(GenericFunction):
    type = Text
    name = quoted_name(EMAIL_LOCAL_PART, False)
    identifier = "email_local_part"


def create_email_type(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {QUOTED_TYPE_NAME};
    """
    create_domain_query = f"""
    CREATE DOMAIN {QUOTED_TYPE_NAME} AS text CHECK (value ~ {EMAIL_REGEX_STR});
    """
    create_email_domain_name_query = f"""
    CREATE OR REPLACE FUNCTION {EMAIL_DOMAIN_NAME}({QUOTED_TYPE_NAME})
    RETURNS text AS $$
        SELECT split_part($1, '@', 2);
    $$
    LANGUAGE SQL RETURNS NULL ON NULL INPUT;
    """
    create_email_local_part_query = f"""
    CREATE OR REPLACE FUNCTION {EMAIL_LOCAL_PART}({QUOTED_TYPE_NAME})
    RETURNS text AS $$
        SELECT split_part($1, '@', 1);
    $$
    LANGUAGE SQL RETURNS NULL ON NULL INPUT;
    """
    with engine.connect() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.execute(text(create_email_domain_name_query))
        conn.execute(text(create_email_local_part_query))
        conn.commit()
