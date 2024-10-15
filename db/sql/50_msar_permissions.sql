----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- FUNCTIONS/COMMANDS RELATED TO GRANTING APPROPRIATE PERMISSIONS FOR msar, __msar AND mathesar_types
-- SCHEMAS TO PUBLIC. 
--
-- !!! DO NOT ADD ANY FUNCTIONS PAST THIS POINT !!!
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
msar.grant_usage_on_custom_mathesar_types_to_public() RETURNS void AS $$
BEGIN
  EXECUTE string_agg(
    format(
      'GRANT USAGE ON TYPE %1$I.%2$I TO PUBLIC',
      pgn.nspname,
      pgt.typname
    ),
    E';\n'
  ) || E';\n'
  FROM pg_catalog.pg_type AS pgt
  JOIN pg_catalog.pg_namespace pgn ON pgn.oid = pgt.typnamespace
  WHERE (pgn.nspname = 'msar'
  OR pgn.nspname = '__msar'
  OR pgn.nspname = 'mathesar_types')
  AND (pgt.typtype = 'c' OR pgt.typtype = 'd')
  AND pgt.typcategory != 'A';
END;
$$ LANGUAGE plpgsql;


GRANT USAGE ON SCHEMA __msar, msar, mathesar_types TO PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA msar, __msar, mathesar_types TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA msar, __msar, mathesar_types TO PUBLIC;
SELECT msar.grant_usage_on_custom_mathesar_types_to_public();
