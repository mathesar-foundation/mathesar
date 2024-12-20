CREATE SCHEMA IF NOT EXISTS msar;

CREATE OR REPLACE FUNCTION
msar.drop_all_msar_objects(retries integer DEFAULT 5) RETURNS void AS $$/*
Drop all functions in the `msar` and `__msar` schemas, including this one.

Then drop the schemas themselves
*/
DECLARE
  obj RECORD;
  rm_schemas text[] := ARRAY['msar', '__msar', 'mathesar_types'];
  detail text;
  hint text;
  stack text;
  message text;
  failed boolean := false;
  retry boolean := false;
BEGIN
  FOR obj IN
    (
      SELECT oid, oid::regprocedure::text AS obj_name,
        CASE prokind
          WHEN 'a' THEN 'AGGREGATE'
          WHEN 'p' THEN 'PROCEDURE'
          ELSE 'FUNCTION'
        END AS obj_kind
      FROM pg_proc
      WHERE pronamespace::regnamespace::text=ANY(rm_schemas)
      AND NOT ( -- Keep this up to date with this function's name and arguments.
        proname = 'drop_all_msar_objects'
        AND proargtypes=ARRAY['integer'::regtype]::oidvector
      )
    ) UNION (
      SELECT oid, oid::regtype::text AS obj_name, 'TYPE' AS obj_kind
      FROM pg_type
      WHERE typnamespace::regnamespace::text=ANY(ARRAY['msar', '__msar']) AND typcategory <> 'A'
    ) UNION (
      SELECT oid, oid::regclass::text AS obj_name, 'TABLE' AS obj_kind
      FROM pg_class
      WHERE relnamespace::regnamespace::text=ANY(rm_schemas) AND relkind='r'
    )
    ORDER BY oid
  LOOP
    RAISE NOTICE 'dropping % with OID %', obj.obj_name, obj.oid;
    BEGIN
      EXECUTE format('DROP %s %s', obj.obj_kind, obj.obj_name);
    EXCEPTION
      WHEN dependent_objects_still_exist THEN
        failed = true;
        GET STACKED DIAGNOSTICS
          message = MESSAGE_TEXT,
          detail = PG_EXCEPTION_DETAIL;
        RAISE NOTICE E'% \nDETAIL: %\n\n', message, detail;
        IF retries > 0 THEN
          retry = true;
        END IF;
      WHEN undefined_function OR undefined_table OR undefined_object THEN
        -- Do nothing.
    END;
  END LOOP;
  IF retry IS true THEN
    PERFORM msar.drop_all_msar_objects(retries - 1);
  ELSIF failed IS TRUE THEN
    RAISE NOTICE 'Some objects not dropped!';
  ELSE
    RAISE NOTICE E'All objects dropped successfully!\n\nDropping myself...\n\n';
    DROP FUNCTION msar.drop_all_msar_objects(integer);
    DROP SCHEMA IF EXISTS msar;
    DROP SCHEMA IF EXISTS __msar;
  END IF;
END;
$$ LANGUAGE plpgsql;
