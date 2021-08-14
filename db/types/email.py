from sqlalchemy import text, Text
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from db.types import base

EMAIL = "email"
EMAIL_DOMAIN_NAME = EMAIL + "_domain_name"
EMAIL_LOCAL_PART = EMAIL + "_local_part"

DB_TYPE = base.get_qualified_name(EMAIL)
QUALIFIED_EMAIL_DOMAIN_NAME = base.get_qualified_name(EMAIL_DOMAIN_NAME)
QUALIFIED_EMAIL_LOCAL_PART = base.get_qualified_name(EMAIL_LOCAL_PART)

# This is directly from the HTML5 email spec, we could change it based on our
# needs (it's more restrictive than the actual RFC)
EMAIL_REGEX_STR = (
    r"'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    r"[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)


class Email(UserDefinedType):
    def get_col_spec(self, **kw):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()


# This will register our custom email_domain_name function with sqlalchemy so
# it can be used via `func.email_domain_name`
class email_domain_name(GenericFunction):
    type = Text
    name = quoted_name(QUALIFIED_EMAIL_DOMAIN_NAME, False)
    identifier = EMAIL_DOMAIN_NAME


# This will register our custom email_local_part function with sqlalchemy so
# it can be used via `func.email_local_part`
class email_local_part(GenericFunction):
    type = Text
    name = quoted_name(QUALIFIED_EMAIL_LOCAL_PART, False)
    identifier = EMAIL_LOCAL_PART


def install(engine):
    # We'll use postgres domains to check that a given string conforms to what
    # an email should look like.  We also create some DB-level functions to
    # split out the different parts of an email address for grouping.
    drop_domain_query = f"""
    DROP DOMAIN IF EXISTS {DB_TYPE};
    """
    create_domain_query = f"""
    CREATE DOMAIN {DB_TYPE} AS text CHECK (value ~ {EMAIL_REGEX_STR});
    """
    create_email_domain_name_query = f"""
    CREATE OR REPLACE FUNCTION {QUALIFIED_EMAIL_DOMAIN_NAME}({DB_TYPE})
    RETURNS text AS $$
        SELECT split_part($1, '@', 2);
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    create_email_local_part_query = f"""
    CREATE OR REPLACE FUNCTION {QUALIFIED_EMAIL_LOCAL_PART}({DB_TYPE})
    RETURNS text AS $$
        SELECT split_part($1, '@', 1);
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    with engine.begin() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(create_domain_query))
        conn.execute(text(create_email_domain_name_query))
        conn.execute(text(create_email_local_part_query))
        conn.commit()
