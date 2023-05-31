DROP SCHEMA msar_tests CASCADE;
CREATE SCHEMA msar_tests;
SET search_path='msar_tests';
CREATE EXTENSION pgtap SCHEMA msar_tests;


CREATE OR REPLACE FUNCTION setup_drop_columns() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE msar_tests.atable (dodrop integer, dontdrop text);
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_columns_oid() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
  col_id integer;
BEGIN
  rel_id := 'msar_tests.atable'::regclass::oid;
  SELECT attnum FROM pg_attribute WHERE attrelid=rel_id AND attname='dodrop' INTO col_id;
  PERFORM msar.drop_columns(rel_id, col_id);
  RETURN NEXT has_column(
    'msar_tests', 'atable', 'dontdrop', 'ID Column dropper keeps correct columns'
  );
  RETURN NEXT hasnt_column(
    'msar_tests', 'atable', 'dodrop', 'ID Column dropper drops correct columns'
  );
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_columns_names() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_columns('msar_tests', 'atable', 'dodrop');
  RETURN NEXT has_column(
    'msar_tests', 'atable', 'dontdrop', 'Name Column dropper keeps correct columns'
  );
  RETURN NEXT hasnt_column(
    'msar_tests', 'atable', 'dodrop', 'Name Column dropper drops correct columns'
  );
END;
$$ LANGUAGE plpgsql;
