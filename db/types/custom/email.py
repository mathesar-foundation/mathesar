from sqlalchemy import text, Text
from sqlalchemy.sql import quoted_name
from sqlalchemy.sql.functions import GenericFunction
from sqlalchemy.types import UserDefinedType

from db.types.base import MathesarCustomType

from db.functions import hints
from db.functions.base import DBFunction, Contains, sa_call_sql_function, Equal
from db.functions.packed import DBFunctionPacked

DB_TYPE = MathesarCustomType.EMAIL.id

EMAIL_DOMAIN_NAME = DB_TYPE + "_domain_name"
EMAIL_LOCAL_PART = DB_TYPE + "_local_part"

# This is directly from the HTML5 email spec, we could change it based on our
# needs (it's more restrictive than the actual RFC)
EMAIL_REGEX_STR = (
    r"'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    r"[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)


class Email(UserDefinedType):

    def get_col_spec(self, **_):
        # This results in the type name being upper case when viewed.
        # Actual usage in the DB is case-insensitive.
        return DB_TYPE.upper()


# This will register our custom email_domain_name function with sqlalchemy so
# it can be used via `func.email_domain_name`
class email_domain_name(GenericFunction):
    type = Text
    name = quoted_name(EMAIL_DOMAIN_NAME, False)
    identifier = EMAIL_DOMAIN_NAME


# This will register our custom email_local_part function with sqlalchemy so
# it can be used via `func.email_local_part`
class email_local_part(GenericFunction):
    type = Text
    name = quoted_name(EMAIL_LOCAL_PART, False)
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
    CREATE OR REPLACE FUNCTION {EMAIL_DOMAIN_NAME}({DB_TYPE})
    RETURNS text AS $$
        SELECT split_part($1, '@', 2);
    $$
    LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;
    """
    create_email_local_part_query = f"""
    CREATE OR REPLACE FUNCTION {EMAIL_LOCAL_PART}({DB_TYPE})
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


class ExtractEmailDomain(DBFunction):
    id = 'extract_email_domain'
    name = 'extract email domain'
    hints = tuple([
        hints.parameter_count(1),
        hints.parameter(1, hints.email),
    ])
    depends_on = tuple([EMAIL_DOMAIN_NAME])

    @staticmethod
    def to_sa_expression(uri):
        return sa_call_sql_function(EMAIL_DOMAIN_NAME, uri)


class EmailDomainContains(DBFunctionPacked):
    id = 'email_domain_contains'
    name = 'email domain contains'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.email),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])
    depends_on = tuple([EMAIL_DOMAIN_NAME])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Contains([
            ExtractEmailDomain([param0]),
            param1,
        ])


class EmailDomainEquals(DBFunctionPacked):
    id = 'email_domain_equals'
    name = 'email domain is'
    hints = tuple([
        hints.returns(hints.boolean),
        hints.parameter_count(2),
        hints.parameter(0, hints.email),
        hints.parameter(1, hints.string_like),
        hints.mathesar_filter,
    ])
    depends_on = tuple([EMAIL_DOMAIN_NAME])

    def unpack(self):
        param0 = self.parameters[0]
        param1 = self.parameters[1]
        return Equal([
            ExtractEmailDomain([param0]),
            param1,
        ])
