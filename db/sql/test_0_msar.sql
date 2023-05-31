DROP SCHEMA msar_tests CASCADE;
CREATE SCHEMA msar_tests;
SET search_path='msar_tests';
CREATE EXTENSION pgtap SCHEMA msar_tests;


CREATE OR REPLACE FUNCTION setup_drop_columns() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE msar_tests.atable (dodrop1 integer, dodrop2 integer, dontdrop text);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION setup_drop_tables() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE msar_tests.dropme (id SERIAL PRIMARY KEY, col1 integer);
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_columns_oid() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'msar_tests.atable'::regclass::oid;
  PERFORM msar.drop_columns(rel_id, 1, 2);
  RETURN NEXT has_column(
    'msar_tests', 'atable', 'dontdrop', 'Keeps correct columns'
  );
  RETURN NEXT hasnt_column(
    'msar_tests', 'atable', 'dodrop1', 'Drops correct columns 1'
  );
  RETURN NEXT hasnt_column(
    'msar_tests', 'atable', 'dodrop2', 'Drops correct columns 2'
  );
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_columns_names() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_columns('msar_tests', 'atable', 'dodrop1', 'dodrop2');
  RETURN NEXT has_column(
    'msar_tests', 'atable', 'dontdrop', 'Dropper keeps correct columns'
  );
  RETURN NEXT hasnt_column(
    'msar_tests', 'atable', 'dodrop1', 'Dropper drops correct columns 1'
  );
  RETURN NEXT hasnt_column(
    'msar_tests', 'atable', 'dodrop2', 'Dropper drops correct columns 2'
  );
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_oid() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'msar_tests.dropme'::regclass::oid;
  PERFORM msar.drop_table(tab_id => rel_id, cascade_ => false, if_exists => false);
  RETURN NEXT hasnt_table('msar_tests', 'dropme', 'Drops table');
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_oid_if_exists() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'msar_tests.dropme'::regclass::oid;
  PERFORM msar.drop_table(tab_id => rel_id, cascade_ => false, if_exists => true);
  RETURN NEXT hasnt_table('msar_tests', 'dropme', 'Drops table with IF EXISTS');
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_oid_restricted_fkey() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'msar_tests.dropme'::regclass::oid;
  CREATE TABLE
    msar_tests.dependent (id SERIAL PRIMARY KEY, col1 integer REFERENCES msar_tests.dropme);
  RETURN NEXT throws_ok(
    format('SELECT msar.drop_table(tab_id => %s, cascade_ => false, if_exists => true);', rel_id),
    '2BP01',
    'cannot drop table dropme because other objects depend on it',
    'Table dropper throws for dependent objects'
  );
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_oid_cascade_fkey() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'msar_tests.dropme'::regclass::oid;
  CREATE TABLE
    msar_tests.dependent (id SERIAL PRIMARY KEY, col1 integer REFERENCES msar_tests.dropme);
  PERFORM msar.drop_table(tab_id => rel_id, cascade_ => true, if_exists => false);
  RETURN NEXT hasnt_table('msar_tests', 'dropme', 'Drops table with dependent using CASCADE');
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_name() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_table(
    sch_name => 'msar_tests',
    tab_name => 'dropme',
    cascade_ => false,
    if_exists => false
  );
  RETURN NEXT hasnt_table('msar_tests', 'dropme', 'Drops table');
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_name_missing_if_exists() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_table(
    sch_name => 'msar_tests',
    tab_name => 'dropmenew',
    cascade_ => false,
    if_exists => true
  );
  RETURN NEXT has_table('msar_tests', 'dropme', 'Drops table with IF EXISTS');
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION test_drop_table_name_missing_no_if_exists() RETURNS SETOF TEXT AS $$
BEGIN
  RETURN NEXT throws_ok(
    'SELECT msar.drop_table(''msar_tests'', ''doesntexist'', false, false);',
    '42P01',
    'table "doesntexist" does not exist',
    'Table dropper throws for missing table'
  );
END;
$$ LANGUAGE plpgsql;
