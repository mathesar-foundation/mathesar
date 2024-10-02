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
    (value IS NULL) OR (mathesar_types.uri_scheme(value) IS NOT NULL
    AND mathesar_types.uri_path(value) IS NOT NULL)
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

-- mathesar_types.cast_to_boolean
CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(boolean)
RETURNS boolean
AS $$

    BEGIN
      RETURN $1::boolean;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(smallint)
RETURNS boolean
AS $$
  BEGIN
    IF $1<>0 AND $1<>1 THEN
      RAISE EXCEPTION '% is not a boolean', $1; END IF;
    RETURN $1<>0;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(real)
RETURNS boolean
AS $$
  BEGIN
    IF $1<>0 AND $1<>1 THEN
      RAISE EXCEPTION '% is not a boolean', $1; END IF;
    RETURN $1<>0;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(bigint)
RETURNS boolean
AS $$
  BEGIN
    IF $1<>0 AND $1<>1 THEN
      RAISE EXCEPTION '% is not a boolean', $1; END IF;
    RETURN $1<>0;
  END;  
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(double precision)
RETURNS boolean
AS $$

    BEGIN
      IF $1<>0 AND $1<>1 THEN
        RAISE EXCEPTION '% is not a boolean', $1; END IF;
      RETURN $1<>0;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(numeric)
RETURNS boolean
AS $$
  BEGIN
    IF $1<>0 AND $1<>1 THEN
      RAISE EXCEPTION '% is not a boolean', $1; END IF;
    RETURN $1<>0;
  END;  
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(integer)
RETURNS boolean
AS $$
  BEGIN
    IF $1<>0 AND $1<>1 THEN
      RAISE EXCEPTION '% is not a boolean', $1; END IF;
    RETURN $1<>0;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(character varying)
RETURNS boolean
AS $$
  DECLARE
  istrue boolean;
  BEGIN
    SELECT
      $1='1' OR lower($1) = 'on'
      OR lower($1)='t' OR lower($1)='true'
      OR lower($1)='y' OR lower($1)='yes'
    INTO istrue;
    IF istrue
      OR $1='0' OR lower($1) = 'off'
      OR lower($1)='f' OR lower($1)='false'
      OR lower($1)='n' OR lower($1)='no'
    THEN
      RETURN istrue;
    END IF;
    RAISE EXCEPTION '% is not a boolean', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(text)
RETURNS boolean
AS $$
  DECLARE
  istrue boolean;
  BEGIN
    SELECT
      $1='1' OR lower($1) = 'on'
      OR lower($1)='t' OR lower($1)='true'
      OR lower($1)='y' OR lower($1)='yes'
    INTO istrue;
    IF istrue
      OR $1='0' OR lower($1) = 'off'
      OR lower($1)='f' OR lower($1)='false'
      OR lower($1)='n' OR lower($1)='no'
    THEN
      RETURN istrue;
    END IF;
    RAISE EXCEPTION '% is not a boolean', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION mathesar_types.cast_to_boolean(character)
RETURNS boolean
AS $$
  DECLARE
  istrue boolean;
  BEGIN
    SELECT
      $1='1' OR lower($1) = 'on'
      OR lower($1)='t' OR lower($1)='true'
      OR lower($1)='y' OR lower($1)='yes'
    INTO istrue;
    IF istrue
      OR $1='0' OR lower($1) = 'off'
      OR lower($1)='f' OR lower($1)='false'
      OR lower($1)='n' OR lower($1)='no'
    THEN
      RETURN istrue;
    END IF;
    RAISE EXCEPTION '% is not a boolean', $1;
  END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_real

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(smallint)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(bigint)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(double precision)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(character)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(integer)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(real)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(character varying)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(mathesar_types.mathesar_money)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(numeric)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(text)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(money)
RETURNS real
AS $$

    BEGIN
      RETURN $1::real;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_real(boolean)
RETURNS real
AS $$

BEGIN
  IF $1 THEN
    RETURN 1::real;
  END IF;
  RETURN 0::real;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_double_precision

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(smallint)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(bigint)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(double precision)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(character)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(integer)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(real)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(character varying)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(mathesar_types.mathesar_money)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(numeric)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(text)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(money)
RETURNS double precision
AS $$

    BEGIN
      RETURN $1::double precision;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_double_precision(boolean)
RETURNS double precision
AS $$

BEGIN
  IF $1 THEN
    RETURN 1::double precision;
  END IF;
  RETURN 0::double precision;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_email

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_email(mathesar_types.email)
RETURNS mathesar_types.email
AS $$

    BEGIN
      RETURN $1::mathesar_types.email;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_email(character varying)
RETURNS mathesar_types.email
AS $$

    BEGIN
      RETURN $1::mathesar_types.email;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_email(text)
RETURNS mathesar_types.email
AS $$

    BEGIN
      RETURN $1::mathesar_types.email;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_email(character)
RETURNS mathesar_types.email
AS $$

    BEGIN
      RETURN $1::mathesar_types.email;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_smallint

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(smallint)
RETURNS smallint
AS $$

    BEGIN
      RETURN $1::smallint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(character varying)
RETURNS smallint
AS $$

    BEGIN
      RETURN $1::smallint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(bigint)
RETURNS smallint
AS $$

    BEGIN
      RETURN $1::smallint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(character)
RETURNS smallint
AS $$

    BEGIN
      RETURN $1::smallint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(text)
RETURNS smallint
AS $$

    BEGIN
      RETURN $1::smallint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(integer)
RETURNS smallint
AS $$

    BEGIN
      RETURN $1::smallint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(real)
RETURNS smallint
AS $$

    DECLARE integer_res smallint;
    BEGIN
      SELECT $1::smallint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(mathesar_types.mathesar_money)
RETURNS smallint
AS $$

    DECLARE integer_res smallint;
    BEGIN
      SELECT $1::smallint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(double precision)
RETURNS smallint
AS $$

    DECLARE integer_res smallint;
    BEGIN
      SELECT $1::smallint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(numeric)
RETURNS smallint
AS $$

    DECLARE integer_res smallint;
    BEGIN
      SELECT $1::smallint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(money)
RETURNS smallint
AS $$

    DECLARE integer_res smallint;
    BEGIN
      SELECT $1::smallint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to smallint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_smallint(boolean)
RETURNS smallint
AS $$

BEGIN
  IF $1 THEN
    RETURN 1::smallint;
  END IF;
  RETURN 0::smallint;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(smallint)
RETURNS bigint
AS $$

    BEGIN
      RETURN $1::bigint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_bigint

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(character varying)
RETURNS bigint
AS $$

    BEGIN
      RETURN $1::bigint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(bigint)
RETURNS bigint
AS $$

    BEGIN
      RETURN $1::bigint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(character)
RETURNS bigint
AS $$

    BEGIN
      RETURN $1::bigint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(text)
RETURNS bigint
AS $$

    BEGIN
      RETURN $1::bigint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(integer)
RETURNS bigint
AS $$

    BEGIN
      RETURN $1::bigint;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(real)
RETURNS bigint
AS $$

    DECLARE integer_res bigint;
    BEGIN
      SELECT $1::bigint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(mathesar_types.mathesar_money)
RETURNS bigint
AS $$

    DECLARE integer_res bigint;
    BEGIN
      SELECT $1::bigint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(double precision)
RETURNS bigint
AS $$

    DECLARE integer_res bigint;
    BEGIN
      SELECT $1::bigint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(numeric)
RETURNS bigint
AS $$

    DECLARE integer_res bigint;
    BEGIN
      SELECT $1::bigint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(money)
RETURNS bigint
AS $$

    DECLARE integer_res bigint;
    BEGIN
      SELECT $1::bigint INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to bigint without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_bigint(boolean)
RETURNS bigint
AS $$

BEGIN
  IF $1 THEN
    RETURN 1::bigint;
  END IF;
  RETURN 0::bigint;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_integer

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(smallint)
RETURNS integer
AS $$

    BEGIN
      RETURN $1::integer;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(character varying)
RETURNS integer
AS $$

    BEGIN
      RETURN $1::integer;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(bigint)
RETURNS integer
AS $$

    BEGIN
      RETURN $1::integer;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(character)
RETURNS integer
AS $$

    BEGIN
      RETURN $1::integer;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(text)
RETURNS integer
AS $$

    BEGIN
      RETURN $1::integer;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(integer)
RETURNS integer
AS $$

    BEGIN
      RETURN $1::integer;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(real)
RETURNS integer
AS $$

    DECLARE integer_res integer;
    BEGIN
      SELECT $1::integer INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(mathesar_types.mathesar_money)
RETURNS integer
AS $$

    DECLARE integer_res integer;
    BEGIN
      SELECT $1::integer INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(double precision)
RETURNS integer
AS $$

    DECLARE integer_res integer;
    BEGIN
      SELECT $1::integer INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(numeric)
RETURNS integer
AS $$

    DECLARE integer_res integer;
    BEGIN
      SELECT $1::integer INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(money)
RETURNS integer
AS $$

    DECLARE integer_res integer;
    BEGIN
      SELECT $1::integer INTO integer_res;
      IF integer_res = $1 THEN
        RETURN integer_res;
      END IF;
      RAISE EXCEPTION '% cannot be cast to integer without loss', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_integer(boolean)
RETURNS integer
AS $$

BEGIN
  IF $1 THEN
    RETURN 1::integer;
  END IF;
  RETURN 0::integer;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_interval

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_interval(interval)
RETURNS interval
AS $$

    BEGIN
      RETURN $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_interval(character varying)
RETURNS interval
AS $$
 BEGIN
      PERFORM $1::numeric;
      RAISE EXCEPTION '% is a numeric', $1;
      EXCEPTION
        WHEN sqlstate '22P02' THEN
          RETURN $1::interval;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_interval(text)
RETURNS interval
AS $$
 BEGIN
      PERFORM $1::numeric;
      RAISE EXCEPTION '% is a numeric', $1;
      EXCEPTION
        WHEN sqlstate '22P02' THEN
          RETURN $1::interval;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_interval(character)
RETURNS interval
AS $$
 BEGIN
      PERFORM $1::numeric;
      RAISE EXCEPTION '% is a numeric', $1;
      EXCEPTION
        WHEN sqlstate '22P02' THEN
          RETURN $1::interval;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_time_without_time_zone

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_without_time_zone(text)
RETURNS time without time zone
AS $$

    BEGIN
      RETURN $1::time without time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_without_time_zone(character varying)
RETURNS time without time zone
AS $$

    BEGIN
      RETURN $1::time without time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_without_time_zone(time without time zone)
RETURNS time without time zone
AS $$

    BEGIN
      RETURN $1::time without time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_without_time_zone(time with time zone)
RETURNS time without time zone
AS $$

    BEGIN
      RETURN $1::time without time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_time_with_time_zone

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_with_time_zone(text)
RETURNS time with time zone
AS $$

    BEGIN
      RETURN $1::time with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_with_time_zone(character varying)
RETURNS time with time zone
AS $$

    BEGIN
      RETURN $1::time with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_with_time_zone(time without time zone)
RETURNS time with time zone
AS $$

    BEGIN
      RETURN $1::time with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_time_with_time_zone(time with time zone)
RETURNS time with time zone
AS $$

    BEGIN
      RETURN $1::time with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_timestamp_with_time_zone

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_with_time_zone(character varying)
RETURNS timestamp with time zone
AS $$

    BEGIN
      RETURN $1::timestamp with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_with_time_zone(timestamp with time zone)
RETURNS timestamp with time zone
AS $$

    BEGIN
      RETURN $1::timestamp with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_with_time_zone(character)
RETURNS timestamp with time zone
AS $$

    BEGIN
      RETURN $1::timestamp with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_with_time_zone(timestamp without time zone)
RETURNS timestamp with time zone
AS $$

    BEGIN
      RETURN $1::timestamp with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_with_time_zone(text)
RETURNS timestamp with time zone
AS $$

    BEGIN
      RETURN $1::timestamp with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_timestamp_without_time_zone

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_without_time_zone(timestamp without time zone)
RETURNS timestamp without time zone
AS $$

    BEGIN
      RETURN $1::timestamp without time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_without_time_zone(character varying)
RETURNS timestamp without time zone
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = timestamp_value) THEN
        RETURN $1::timestamp without time zone;
        END IF;
  
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_without_time_zone(text)
RETURNS timestamp without time zone
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = timestamp_value) THEN
        RETURN $1::timestamp without time zone;
        END IF;
  
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_without_time_zone(character)
RETURNS timestamp without time zone
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = timestamp_value) THEN
        RETURN $1::timestamp without time zone;
        END IF;
  
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_without_time_zone(date)
RETURNS timestamp without time zone
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = timestamp_value) THEN
        RETURN $1::timestamp without time zone;
        END IF;
  
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_timestamp_without_time_zone(timestamp with time zone)
RETURNS timestamp without time zone
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = timestamp_value) THEN
        RETURN $1::timestamp without time zone;
        END IF;
  
  RAISE EXCEPTION '% is not a timestamp without time zone', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_date

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_date(date)
RETURNS date
AS $$

    BEGIN
      RETURN $1::timestamp with time zone;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_date(character varying)
RETURNS date
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = date_value) THEN
        RETURN $1::date;
        END IF;
  
  RAISE EXCEPTION '% is not a date', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_date(text)
RETURNS date
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = date_value) THEN
        RETURN $1::date;
        END IF;
  
  RAISE EXCEPTION '% is not a date', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_date(character)
RETURNS date
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = date_value) THEN
        RETURN $1::date;
        END IF;
  
  RAISE EXCEPTION '% is not a date', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_date(timestamp without time zone)
RETURNS date
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = date_value) THEN
        RETURN $1::date;
        END IF;
  
  RAISE EXCEPTION '% is not a date', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_date(timestamp with time zone)
RETURNS date
AS $$

DECLARE
timestamp_value_with_tz NUMERIC;
timestamp_value NUMERIC;
date_value NUMERIC;
BEGIN
    SET LOCAL TIME ZONE 'UTC';
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITH TIME ZONE ) INTO timestamp_value_with_tz;
    SELECT EXTRACT(EPOCH FROM $1::TIMESTAMP WITHOUT TIME ZONE) INTO timestamp_value;
    SELECT EXTRACT(EPOCH FROM $1::DATE ) INTO date_value;
    
        IF (timestamp_value_with_tz = date_value) THEN
        RETURN $1::date;
        END IF;
  
  RAISE EXCEPTION '% is not a date', $1;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_mathesar_money

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(mathesar_types.mathesar_money)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_money;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(smallint)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::numeric::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(real)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::numeric::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(bigint)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::numeric::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(double precision)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::numeric::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(numeric)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::numeric::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(integer)
RETURNS mathesar_types.mathesar_money
AS $$

    BEGIN
      RETURN $1::numeric::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(character varying)
RETURNS mathesar_types.mathesar_money
AS $$

    DECLARE decimal_point text;
    DECLARE is_negative boolean;
    DECLARE money_arr text[];
    DECLARE money_num text;
    BEGIN
      SELECT mathesar_types.get_mathesar_money_array($1::text) INTO money_arr;
      IF money_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to mathesar_types.mathesar_money', $1;
      END IF;
      SELECT money_arr[1] INTO money_num;
      SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
      SELECT $1::text ~ '^.*(-|\(.+\)).*$' INTO is_negative;
      IF money_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
      END IF;
      IF money_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
      END IF;
      IF is_negative THEN
        RETURN ('-' || money_num)::mathesar_types.mathesar_money;
      END IF;
      RETURN money_num::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(text)
RETURNS mathesar_types.mathesar_money
AS $$

    DECLARE decimal_point text;
    DECLARE is_negative boolean;
    DECLARE money_arr text[];
    DECLARE money_num text;
    BEGIN
      SELECT mathesar_types.get_mathesar_money_array($1::text) INTO money_arr;
      IF money_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to mathesar_types.mathesar_money', $1;
      END IF;
      SELECT money_arr[1] INTO money_num;
      SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
      SELECT $1::text ~ '^.*(-|\(.+\)).*$' INTO is_negative;
      IF money_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
      END IF;
      IF money_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
      END IF;
      IF is_negative THEN
        RETURN ('-' || money_num)::mathesar_types.mathesar_money;
      END IF;
      RETURN money_num::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(money)
RETURNS mathesar_types.mathesar_money
AS $$

    DECLARE decimal_point text;
    DECLARE is_negative boolean;
    DECLARE money_arr text[];
    DECLARE money_num text;
    BEGIN
      SELECT mathesar_types.get_mathesar_money_array($1::text) INTO money_arr;
      IF money_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to mathesar_types.mathesar_money', $1;
      END IF;
      SELECT money_arr[1] INTO money_num;
      SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
      SELECT $1::text ~ '^.*(-|\(.+\)).*$' INTO is_negative;
      IF money_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
      END IF;
      IF money_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
      END IF;
      IF is_negative THEN
        RETURN ('-' || money_num)::mathesar_types.mathesar_money;
      END IF;
      RETURN money_num::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_money(character)
RETURNS mathesar_types.mathesar_money
AS $$

    DECLARE decimal_point text;
    DECLARE is_negative boolean;
    DECLARE money_arr text[];
    DECLARE money_num text;
    BEGIN
      SELECT mathesar_types.get_mathesar_money_array($1::text) INTO money_arr;
      IF money_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to mathesar_types.mathesar_money', $1;
      END IF;
      SELECT money_arr[1] INTO money_num;
      SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
      SELECT $1::text ~ '^.*(-|\(.+\)).*$' INTO is_negative;
      IF money_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[2], '', 'gq') INTO money_num;
      END IF;
      IF money_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(money_num, money_arr[3], decimal_point, 'q') INTO money_num;
      END IF;
      IF is_negative THEN
        RETURN ('-' || money_num)::mathesar_types.mathesar_money;
      END IF;
      RETURN money_num::mathesar_types.mathesar_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_money

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(mathesar_types.mathesar_money)
RETURNS money
AS $$

    BEGIN
      RETURN $1::money;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(money)
RETURNS money
AS $$

    BEGIN
      RETURN $1::money;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(smallint)
RETURNS money
AS $$

    BEGIN
      RETURN $1::numeric::money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(real)
RETURNS money
AS $$

    BEGIN
      RETURN $1::numeric::money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(bigint)
RETURNS money
AS $$

    BEGIN
      RETURN $1::numeric::money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(double precision)
RETURNS money
AS $$

    BEGIN
      RETURN $1::numeric::money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(numeric)
RETURNS money
AS $$

    BEGIN
      RETURN $1::numeric::money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(integer)
RETURNS money
AS $$

    BEGIN
      RETURN $1::numeric::money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(character varying)
RETURNS money
AS $$

    DECLARE currency text;
    BEGIN
      SELECT to_char(1, 'L') INTO currency;
      IF ($1 LIKE '%' || currency) OR ($1 LIKE currency || '%') THEN
        RETURN $1::money;
      END IF;
      RAISE EXCEPTION '% cannot be cast to money as currency symbol is missing', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(text)
RETURNS money
AS $$

    DECLARE currency text;
    BEGIN
      SELECT to_char(1, 'L') INTO currency;
      IF ($1 LIKE '%' || currency) OR ($1 LIKE currency || '%') THEN
        RETURN $1::money;
      END IF;
      RAISE EXCEPTION '% cannot be cast to money as currency symbol is missing', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_money(character)
RETURNS money
AS $$

    DECLARE currency text;
    BEGIN
      SELECT to_char(1, 'L') INTO currency;
      IF ($1 LIKE '%' || currency) OR ($1 LIKE currency || '%') THEN
        RETURN $1::money;
      END IF;
      RAISE EXCEPTION '% cannot be cast to money as currency symbol is missing', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_multicurrency_money

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(mathesar_types.multicurrency_money)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN $1::mathesar_types.multicurrency_money;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(smallint)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(real)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(mathesar_types.mathesar_money)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(bigint)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(double precision)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(numeric)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(integer)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(character varying)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1::numeric, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(text)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1::numeric, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(money)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1::numeric, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_multicurrency_money(character)
RETURNS mathesar_types.multicurrency_money
AS $$

    BEGIN
      RETURN ROW($1::numeric, 'USD')::mathesar_types.multicurrency_money;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_character_varying

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(time without time zone)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(bigint)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(double precision)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(mathesar_types.multicurrency_money)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(mathesar_types.uri)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(time with time zone)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(integer)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(real)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(mathesar_types.mathesar_money)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(tsvector)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(jsonb)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying("char")
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(interval)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(macaddr)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(smallint)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(timestamp with time zone)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(inet)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(boolean)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(int4range)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(mathesar_types.mathesar_json_object)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(tstzrange)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(regclass)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(character)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(tsrange)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(numrange)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(cidr)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(character varying)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(numeric)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(mathesar_types.email)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(bit)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(money)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(int8range)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(oid)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(json)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(daterange)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(timestamp without time zone)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(bytea)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(date)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(mathesar_types.mathesar_json_array)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(text)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character_varying(uuid)
RETURNS character varying
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_character

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(time without time zone)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(bigint)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(double precision)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(mathesar_types.multicurrency_money)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(mathesar_types.uri)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(time with time zone)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(integer)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(real)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(mathesar_types.mathesar_money)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(tsvector)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(jsonb)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character("char")
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(interval)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(macaddr)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(smallint)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(timestamp with time zone)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(inet)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(boolean)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(int4range)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(mathesar_types.mathesar_json_object)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(tstzrange)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(regclass)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(character)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(tsrange)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(numrange)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(cidr)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(character varying)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(numeric)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(mathesar_types.email)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(bit)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(money)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(int8range)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(oid)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(json)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(daterange)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(timestamp without time zone)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(bytea)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(date)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(mathesar_types.mathesar_json_array)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(text)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_character(uuid)
RETURNS character
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to__double_quote_char_double_quote_

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(time without time zone)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(bigint)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(double precision)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(mathesar_types.multicurrency_money)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(mathesar_types.uri)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(time with time zone)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(integer)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(real)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(mathesar_types.mathesar_money)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(tsvector)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(jsonb)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_("char")
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(interval)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(macaddr)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(smallint)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(timestamp with time zone)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(inet)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(boolean)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(int4range)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(mathesar_types.mathesar_json_object)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(tstzrange)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(regclass)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(character)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(tsrange)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(numrange)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(cidr)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(character varying)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(numeric)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(mathesar_types.email)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(bit)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(money)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(int8range)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(oid)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(json)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(daterange)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(timestamp without time zone)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(bytea)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(date)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(mathesar_types.mathesar_json_array)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(text)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to__double_quote_char_double_quote_(uuid)
RETURNS "char"
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_text

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(time without time zone)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(bigint)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(double precision)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(mathesar_types.multicurrency_money)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(mathesar_types.uri)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(time with time zone)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(integer)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(real)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(mathesar_types.mathesar_money)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(tsvector)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(jsonb)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text("char")
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(interval)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(macaddr)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(smallint)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(timestamp with time zone)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(inet)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(boolean)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(int4range)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(mathesar_types.mathesar_json_object)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(tstzrange)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(regclass)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(character)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(tsrange)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(numrange)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(cidr)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(character varying)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(numeric)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(mathesar_types.email)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(bit)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(money)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(int8range)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(oid)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(json)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(daterange)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(timestamp without time zone)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(bytea)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(date)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(mathesar_types.mathesar_json_array)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(text)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_text(uuid)
RETURNS text
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_name

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(time without time zone)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(bigint)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(double precision)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(mathesar_types.multicurrency_money)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(mathesar_types.uri)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(time with time zone)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(integer)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(real)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(mathesar_types.mathesar_money)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(tsvector)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(jsonb)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name("char")
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(interval)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(macaddr)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(smallint)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(timestamp with time zone)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(inet)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(boolean)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(int4range)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(mathesar_types.mathesar_json_object)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(tstzrange)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(regclass)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(character)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(tsrange)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(numrange)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(cidr)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(character varying)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(numeric)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(mathesar_types.email)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(bit)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(money)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(int8range)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(oid)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(json)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(daterange)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(timestamp without time zone)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(bytea)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(date)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(mathesar_types.mathesar_json_array)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(text)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_name(uuid)
RETURNS name
AS $$

    BEGIN
      RETURN $1::text;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_uri

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_uri(character varying)
RETURNS mathesar_types.uri
AS $$

    DECLARE uri_res mathesar_types.uri := 'https://centerofci.org';
    DECLARE uri_tld text;
    BEGIN
      RETURN $1::mathesar_types.uri;
      EXCEPTION WHEN SQLSTATE '23514' THEN
          SELECT lower(('http://' || $1)::mathesar_types.uri) INTO uri_res;
          SELECT (regexp_match(mathesar_types.uri_authority(uri_res), '(?<=\.)(?:.(?!\.))+$'))[1]
            INTO uri_tld;
          IF EXISTS(SELECT 1 FROM mathesar_types.top_level_domains WHERE tld = uri_tld) THEN
            RETURN uri_res;
          END IF;
      RAISE EXCEPTION '% is not a mathesar_types.uri', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_uri(text)
RETURNS mathesar_types.uri
AS $$

    DECLARE uri_res mathesar_types.uri := 'https://centerofci.org';
    DECLARE uri_tld text;
    BEGIN
      RETURN $1::mathesar_types.uri;
      EXCEPTION WHEN SQLSTATE '23514' THEN
          SELECT lower(('http://' || $1)::mathesar_types.uri) INTO uri_res;
          SELECT (regexp_match(mathesar_types.uri_authority(uri_res), '(?<=\.)(?:.(?!\.))+$'))[1]
            INTO uri_tld;
          IF EXISTS(SELECT 1 FROM mathesar_types.top_level_domains WHERE tld = uri_tld) THEN
            RETURN uri_res;
          END IF;
      RAISE EXCEPTION '% is not a mathesar_types.uri', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_uri(mathesar_types.uri)
RETURNS mathesar_types.uri
AS $$

    DECLARE uri_res mathesar_types.uri := 'https://centerofci.org';
    DECLARE uri_tld text;
    BEGIN
      RETURN $1::mathesar_types.uri;
      EXCEPTION WHEN SQLSTATE '23514' THEN
          SELECT lower(('http://' || $1)::mathesar_types.uri) INTO uri_res;
          SELECT (regexp_match(mathesar_types.uri_authority(uri_res), '(?<=\.)(?:.(?!\.))+$'))[1]
            INTO uri_tld;
          IF EXISTS(SELECT 1 FROM mathesar_types.top_level_domains WHERE tld = uri_tld) THEN
            RETURN uri_res;
          END IF;
      RAISE EXCEPTION '% is not a mathesar_types.uri', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_uri(character)
RETURNS mathesar_types.uri
AS $$

    DECLARE uri_res mathesar_types.uri := 'https://centerofci.org';
    DECLARE uri_tld text;
    BEGIN
      RETURN $1::mathesar_types.uri;
      EXCEPTION WHEN SQLSTATE '23514' THEN
          SELECT lower(('http://' || $1)::mathesar_types.uri) INTO uri_res;
          SELECT (regexp_match(mathesar_types.uri_authority(uri_res), '(?<=\.)(?:.(?!\.))+$'))[1]
            INTO uri_tld;
          IF EXISTS(SELECT 1 FROM mathesar_types.top_level_domains WHERE tld = uri_tld) THEN
            RETURN uri_res;
          END IF;
      RAISE EXCEPTION '% is not a mathesar_types.uri', $1;
    END;
    
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_numeric

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(smallint)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(real)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(bigint)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(double precision)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(numeric)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(money)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(integer)
RETURNS numeric
AS $$

    BEGIN
      RETURN $1::numeric;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(character varying)
RETURNS numeric
AS $$

DECLARE decimal_point text;
DECLARE is_negative boolean;
DECLARE numeric_arr text[];
DECLARE numeric text;
BEGIN
    SELECT mathesar_types.get_numeric_array($1::text) INTO numeric_arr;
    IF numeric_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to numeric', $1;
    END IF;
    SELECT numeric_arr[1] INTO numeric;
    SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
    SELECT $1::text ~ '^-.*$' INTO is_negative;
    IF numeric_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(numeric, numeric_arr[2], '', 'gq') INTO numeric;
    END IF;
    IF numeric_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(numeric, numeric_arr[3], decimal_point, 'q') INTO numeric;
    END IF;
    IF is_negative THEN
        RETURN ('-' || numeric)::numeric;
    END IF;
    RETURN numeric::numeric;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(text)
RETURNS numeric
AS $$

DECLARE decimal_point text;
DECLARE is_negative boolean;
DECLARE numeric_arr text[];
DECLARE numeric text;
BEGIN
    SELECT mathesar_types.get_numeric_array($1::text) INTO numeric_arr;
    IF numeric_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to numeric', $1;
    END IF;
    SELECT numeric_arr[1] INTO numeric;
    SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
    SELECT $1::text ~ '^-.*$' INTO is_negative;
    IF numeric_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(numeric, numeric_arr[2], '', 'gq') INTO numeric;
    END IF;
    IF numeric_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(numeric, numeric_arr[3], decimal_point, 'q') INTO numeric;
    END IF;
    IF is_negative THEN
        RETURN ('-' || numeric)::numeric;
    END IF;
    RETURN numeric::numeric;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(character)
RETURNS numeric
AS $$

DECLARE decimal_point text;
DECLARE is_negative boolean;
DECLARE numeric_arr text[];
DECLARE numeric text;
BEGIN
    SELECT mathesar_types.get_numeric_array($1::text) INTO numeric_arr;
    IF numeric_arr IS NULL THEN
        RAISE EXCEPTION '% cannot be cast to numeric', $1;
    END IF;
    SELECT numeric_arr[1] INTO numeric;
    SELECT ltrim(to_char(1, 'D'), ' ') INTO decimal_point;
    SELECT $1::text ~ '^-.*$' INTO is_negative;
    IF numeric_arr[2] IS NOT NULL THEN
        SELECT regexp_replace(numeric, numeric_arr[2], '', 'gq') INTO numeric;
    END IF;
    IF numeric_arr[3] IS NOT NULL THEN
        SELECT regexp_replace(numeric, numeric_arr[3], decimal_point, 'q') INTO numeric;
    END IF;
    IF is_negative THEN
        RETURN ('-' || numeric)::numeric;
    END IF;
    RETURN numeric::numeric;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_numeric(boolean)
RETURNS numeric
AS $$

BEGIN
  IF $1 THEN
    RETURN 1::numeric;
  END IF;
  RETURN 0::numeric;
END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_jsonb

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(character varying)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(json)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(character)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(jsonb)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(mathesar_types.mathesar_json_array)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(text)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_jsonb(mathesar_types.mathesar_json_object)
RETURNS jsonb
AS $$

    BEGIN
      RETURN $1::jsonb;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_mathesar_json_array

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(character varying)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(json)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(character)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(jsonb)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(mathesar_types.mathesar_json_array)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(text)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_array(mathesar_types.mathesar_json_object)
RETURNS mathesar_types.mathesar_json_array
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_array;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_mathesar_json_object

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(character varying)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(json)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(character)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(jsonb)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(mathesar_types.mathesar_json_array)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(text)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_mathesar_json_object(mathesar_types.mathesar_json_object)
RETURNS mathesar_types.mathesar_json_object
AS $$

    BEGIN
      RETURN $1::mathesar_types.mathesar_json_object;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- mathesar_types.cast_to_json

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(character varying)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(json)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(character)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(jsonb)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(mathesar_types.mathesar_json_array)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(text)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION mathesar_types.cast_to_json(mathesar_types.mathesar_json_object)
RETURNS json
AS $$

    BEGIN
      RETURN $1::json;
    END;

$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
