CREATE OR REPLACE FUNCTION
msar.drop_all_msar_objects(
  schemas_to_remove text[],
  remove_custom_types boolean DEFAULT true,
  strict boolean DEFAULT true
) RETURNS void AS $$/*
Drop all functions in the passed schemas, including this one.

Then drop the schemas themselves.
*/
DECLARE
  i integer;
  obj RECORD;
  sch text;
  detail text;
  message text;
  failed boolean := false;
BEGIN
  INSERT INTO msar.all_mathesar_objects
    SELECT oid::regclass::text AS obj_name, 'TABLE' AS obj_kind, null AS custom_type
    FROM pg_class
    WHERE
      relnamespace::regnamespace::text='mathesar_inference_schema'
      AND relkind='r'
      AND relname LIKE 'mathesar_temp_table%'
    ON CONFLICT DO NOTHING;

  INSERT INTO msar.all_mathesar_objects
    SELECT oid::regprocedure::text AS obj_name, 'FUNCTION' AS obj_kind, null AS custom_type
    FROM pg_proc
    WHERE pronamespace::regnamespace::text='msar' AND proname='drop_all_msar_objects'
    ON CONFLICT DO NOTHING;

  SET client_min_messages = WARNING;
  FOR i in 1..10 LOOP
    FOR obj IN
      SELECT obj_schema, obj_name, obj_kind, custom_type
      FROM msar.all_mathesar_objects
      WHERE
        obj_schema=ANY(schemas_to_remove)
        AND (remove_custom_types OR custom_type IS NOT true)
        AND NOT (obj_name='msar.all_mathesar_objects')
    LOOP
      BEGIN
        EXECUTE format('DROP %s IF EXISTS %s', obj.obj_kind, obj.obj_name);
      EXCEPTION
        WHEN dependent_objects_still_exist THEN
          IF i >= 10 THEN
            failed = true;
          END IF;
          GET STACKED DIAGNOSTICS
            message = MESSAGE_TEXT,
            detail = PG_EXCEPTION_DETAIL;
          RAISE WARNING E'% \nDETAIL: %\n\n', message, detail;
      END;
    END LOOP;
  END LOOP;
  SET client_min_messages = NOTICE;
  IF failed IS TRUE AND NOT strict THEN
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
    DROP FUNCTION IF EXISTS msar.drop_all_msar_objects(text[], boolean, boolean);
    DROP TABLE IF EXISTS msar.all_mathesar_objects;
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
