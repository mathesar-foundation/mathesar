CREATE SCHEMA IF NOT EXISTS msar;


CREATE OR REPLACE FUNCTION
msar.drop_all_msar_objects(
  schemas_to_remove text[],
  remove_custom_types boolean DEFAULT true,
  strict boolean DEFAULT true,
  retries integer DEFAULT 5
) RETURNS void AS $$/*
Drop all functions in the passed schemas, including this one.

Then drop the schemas themselves.
*/
DECLARE
  obj RECORD;
  sch text;
  detail text;
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
      WHERE pronamespace::regnamespace::text=ANY(schemas_to_remove)
        AND NOT ( -- Keep this up to date with this function's name and arguments.
          proname = 'drop_all_msar_objects'
          AND proargtypes=ARRAY[
            'text[]'::regtype, 'boolean'::regtype, 'boolean'::regtype, 'integer'::regtype
          ]::oidvector
        )
    ) UNION (
      SELECT oid, oid::regtype::text AS obj_name, 'TYPE' AS obj_kind
      FROM pg_type
      WHERE typnamespace::regnamespace::text=ANY(schemas_to_remove)
        AND typcategory <> 'A'
        AND (remove_custom_types OR typnamespace::regnamespace::text <> 'mathesar_types')
    ) UNION (
      SELECT oid, oid::regclass::text AS obj_name, 'TABLE' AS obj_kind
      FROM pg_class
      WHERE relnamespace::regnamespace::text=ANY(schemas_to_remove) AND relkind='r'
    )
    ORDER BY oid
  LOOP
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
    PERFORM msar.drop_all_msar_objects(schemas_to_remove, remove_custom_types, strict, retries - 1);
  ELSIF failed IS TRUE AND NOT strict THEN
    RAISE NOTICE 'Some objects not dropped!';
  ELSIF failed IS TRUE AND strict THEN
    RAISE EXCEPTION USING
      MESSAGE = message,
      DETAIL = detail,
      HINT = 'All changes will be reverted.',
      ERRCODE = 'dependent_objects_still_exist'
    ;
  ELSE
    RAISE NOTICE E'All objects dropped successfully!\n\nDropping Mathesar schemas...\n\n';
    DROP FUNCTION msar.drop_all_msar_objects(text[], boolean, boolean, integer);
    FOREACH sch IN ARRAY schemas_to_remove
      LOOP
        IF remove_custom_types OR sch <> 'mathesar_types' THEN
          RAISE NOTICE 'Dropping Schema %', sch;
          EXECUTE(format('DROP SCHEMA IF EXISTS %I', sch));
        END IF;
      END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;
