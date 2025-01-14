CREATE SCHEMA IF NOT EXISTS mathesar_types;
-- mathesar_types.email
DO $$
BEGIN
  CREATE DOMAIN mathesar_types.email AS text CHECK (value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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
  WHEN duplicate_object THEN
    ALTER DOMAIN mathesar_types.uri
    ADD CONSTRAINT uri_check_new  CHECK (
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
    ) NOT VALID;
    ALTER DOMAIN mathesar_types.uri
    DROP CONSTRAINT uri_check;
    ALTER DOMAIN mathesar_types.uri
    RENAME CONSTRAINT uri_check_new TO uri_check;
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
