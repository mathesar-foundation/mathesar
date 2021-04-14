from sqlalchemy import text, create_engine, Text
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from mathesar.database.types import constants as c

# Since we want to have our identifiers quoted appropriately for use in
# PostgreSQL, we want to use the postgres dialect preparer to set this up.
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

# This is directly from the HTML5 email spec, we could change it based on our
# needs (it's more restrictive than the actual RFC)
EMAIL_REGEX_STR = (
    r"'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    r"[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)


class Email(UserDefinedType):
    def get_col_spec(self, **kw):
        return QUALIFIED_EMAIL


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


def create_email_type(engine):
    # We'll use postgres domains to check that a given string conforms to what
    # an email should look like.  We also create some DB-level functions to
    # split out the different parts of an email address for grouping.
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
