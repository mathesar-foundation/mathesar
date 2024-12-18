CREATE SCHEMA IF NOT EXISTS mathesar_types;
-- mathesar_types.email
DO $$
BEGIN
  CREATE DOMAIN mathesar_types.email AS text CHECK (value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION mathesar_types.email_domain_name(mathesar_types.email)
RETURNS text AS $$
    SELECT split_part($1, '@', 2);
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.email_local_part(mathesar_types.email)
RETURNS text AS $$
    SELECT split_part($1, '@', 1);
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

-- mathesar_types.money
DO $$
BEGIN
  CREATE DOMAIN mathesar_types.mathesar_money AS NUMERIC;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- mathesar_types.multicurrency
DO $$
BEGIN
  CREATE TYPE mathesar_types.multicurrency_money AS (value NUMERIC, currency CHAR(3));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- mathesar_types.uri
CREATE OR REPLACE FUNCTION mathesar_types.uri_parts(text)
RETURNS text[] AS $$
    SELECT regexp_match($1, '^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?');
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.uri_scheme(text)
RETURNS text AS $$
    SELECT (mathesar_types.uri_parts($1))[2];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.uri_authority(text)
RETURNS text AS $$
    SELECT (mathesar_types.uri_parts($1))[4];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.uri_path(text)
RETURNS text AS $$
    SELECT (mathesar_types.uri_parts($1))[5];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.uri_query(text)
RETURNS text AS $$
    SELECT (mathesar_types.uri_parts($1))[7];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.uri_fragment(text)
RETURNS text AS $$
    SELECT (mathesar_types.uri_parts($1))[9];
$$
LANGUAGE SQL IMMUTABLE RETURNS NULL ON NULL INPUT;

DO $$
BEGIN
  CREATE DOMAIN mathesar_types.uri AS text CHECK (
    (value IS NULL) OR (
      -- Check that the 2nd and 5th groups from the URI RFC spec are non-null.
      array_position(
        regexp_match(
          value,
          '^(?:([^:/?#]+):)?(?://(?:[^/?#]*))?([^?#]*)(?:\?(?:[^#]*))?(?:#(?:.*))?'
        ),
        null
      ) IS NULL
    )
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- mathesar_types.json_array
DO $$
BEGIN
  CREATE DOMAIN mathesar_types.mathesar_json_array AS JSONB CHECK (jsonb_typeof(VALUE) = 'array');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- mathesar_types.json_object
DO $$
BEGIN
  CREATE DOMAIN mathesar_types.mathesar_json_object AS JSONB CHECK (jsonb_typeof(VALUE) = 'object');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
