from sqlalchemy import text, create_engine, func
from sqlalchemy.sql.functions import Function
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
EMAIL_LOADS = ".".join(
    [
        preparer.quote_schema(c.TYPE_SCHEMA),
        preparer.quote(EMAIL_SPEC_BASE) + "_loads"
    ]
)
EMAIL_DUMPS = ".".join(
    [
        preparer.quote_schema(c.TYPE_SCHEMA),
        preparer.quote(EMAIL_SPEC_BASE) + "_dumps"
    ]
)

FULL_ADDRESS = "full_address"
USER_NAME = "user_name"
DOMAIN_NAME = "domain_name"
EMAIL_COMPOSITE = {
    FULL_ADDRESS: "text",
    USER_NAME: "text",
    DOMAIN_NAME: "text",
}
EMAIL_REGEX_STR = (
    "'^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    "[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'"
)

class Email(UserDefinedType):
    def get_col_spec(self, **kw):
        return QUOTED_TYPE_NAME

    def bind_expression(self, bindvalue):
        # This is brittle.  We need to figure out how to sync the SQLAlchemy
        # function with the underlying DB function in a more robust way
        return func.mathesar_types.email_loads(bindvalue)

    def column_expression(self, col):
        # This is brittle.  We need to figure out how to sync the SQLAlchemy
        # function with the underlying DB function in a more robust way
        return func.mathesar_types.email_dumps(col)


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
    create_email_loads_query = f"""
    CREATE OR REPLACE FUNCTION {EMAIL_LOADS}(text)
    RETURNS {QUOTED_TYPE_NAME} AS $$
      SELECT ($1, split_part($1, '@', 1), split_part($1, '@', 2))
    $$
    LANGUAGE SQL RETURNS NULL ON NULL INPUT;
    """
    create_email_dumps_query = f"""
    CREATE OR REPLACE FUNCTION {EMAIL_DUMPS}({QUOTED_TYPE_NAME})
    RETURNS text AS $$
      SELECT ($1).{FULL_ADDRESS}
    $$
    LANGUAGE SQL RETURNS NULL ON NULL INPUT;
    """
    with engine.connect() as conn:
        conn.execute(text(drop_domain_query))
        conn.execute(text(drop_type_query))
        conn.execute(text(create_type_query))
        conn.execute(text(create_domain_query))
        conn.execute(text(create_email_loads_query))
        conn.execute(text(create_email_dumps_query))
        conn.commit()
