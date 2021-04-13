from sqlalchemy import text, create_engine, func, Text, cast
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from mathesar.database.types import constants as c

preparer = create_engine("postgresql://").dialect.identifier_preparer

EMAIL = "email"
EMAIL_DOMAIN_NAME = EMAIL + "_domain_name"
EMAIL_LOCAL_PART = EMAIL + "_local_part"

QUALIFIED_EMAIL = ".".join([preparer.quote_schema(c.TYPE_SCHEMA), EMAIL])
QUALIFIED_EMAIL_DOMAIN_NAME = ".".join(
    [preparer.quote_schema(c.TYPE_SCHEMA), EMAIL_DOMAIN_NAME]
)
QUALIFIED_EMAIL_LOCAL_PART = ".".join(
    [preparer.quote_schema(c.TYPE_SCHEMA), EMAIL_LOCAL_PART]
)

EMAIL_REGEX_STR = (
    "'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    "[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)

class Email(UserDefinedType):
    def get_col_spec(self, **kw):
        return QUALIFIED_EMAIL


class email_domain_name(GenericFunction):
    type = Text
    name = quoted_name(QUALIFIED_EMAIL_DOMAIN_NAME, False)
    identifier = EMAIL_DOMAIN_NAME


class email_local_part(GenericFunction):
    type = Text
    name = quoted_name(QUALIFIED_EMAIL_LOCAL_PART, False)
    identifier = EMAIL_LOCAL_PART


def create_email_type(engine):
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {QUALIFIED_EMAIL};
    """
    create_domain_query = f"""
    CREATE DOMAIN {QUALIFIED_EMAIL} AS text CHECK (value ~ {EMAIL_REGEX_STR});
    """
    create_email_domain_name_query = f"""
    CREATE OR REPLACE FUNCTION {QUALIFIED_EMAIL_DOMAIN_NAME}({QUALIFIED_EMAIL})
    RETURNS text AS $$
        SELECT split_part($1, '@', 2);
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    create_email_local_part_query = f"""
    CREATE OR REPLACE FUNCTION {QUALIFIED_EMAIL_LOCAL_PART}({QUALIFIED_EMAIL})
    RETURNS text AS $$
        SELECT split_part($1, '@', 1);
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    with engine.connect() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.execute(text(create_email_domain_name_query))
        conn.execute(text(create_email_local_part_query))
        conn.commit()
