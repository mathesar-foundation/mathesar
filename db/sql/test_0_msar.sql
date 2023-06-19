DROP EXTENSION IF EXISTS pgtap CASCADE;
CREATE EXTENSION IF NOT EXISTS pgtap;

-- msar.drop_columns -------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION setup_drop_columns() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE atable (dodrop1 integer, dodrop2 integer, dontdrop text);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_columns_oid() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'atable'::regclass::oid;
  PERFORM msar.drop_columns(rel_id, 1, 2);
  RETURN NEXT has_column(
    'atable', 'dontdrop', 'Keeps correct columns'
  );
  RETURN NEXT hasnt_column(
    'atable', 'dodrop1', 'Drops correct columns 1'
  );
  RETURN NEXT hasnt_column(
    'atable', 'dodrop2', 'Drops correct columns 2'
  );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_columns_names() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_columns('public', 'atable', 'dodrop1', 'dodrop2');
  RETURN NEXT has_column(
    'atable', 'dontdrop', 'Dropper keeps correct columns'
  );
  RETURN NEXT hasnt_column(
    'atable', 'dodrop1', 'Dropper drops correct columns 1'
  );
  RETURN NEXT hasnt_column(
    'atable', 'dodrop2', 'Dropper drops correct columns 2'
  );
END;
$$ LANGUAGE plpgsql;


-- msar.drop_table ---------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION setup_drop_tables() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE dropme (id SERIAL PRIMARY KEY, col1 integer);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_drop_table_oid() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'dropme'::regclass::oid;
  PERFORM msar.drop_table(tab_id => rel_id, cascade_ => false, if_exists => false);
  RETURN NEXT hasnt_table('dropme', 'Drops table');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_table_oid_if_exists() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'dropme'::regclass::oid;
  PERFORM msar.drop_table(tab_id => rel_id, cascade_ => false, if_exists => true);
  RETURN NEXT hasnt_table('dropme', 'Drops table with IF EXISTS');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_table_oid_restricted_fkey() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'dropme'::regclass::oid;
  CREATE TABLE
    dependent (id SERIAL PRIMARY KEY, col1 integer REFERENCES dropme);
  RETURN NEXT throws_ok(
    format('SELECT msar.drop_table(tab_id => %s, cascade_ => false, if_exists => true);', rel_id),
    '2BP01',
    'cannot drop table dropme because other objects depend on it',
    'Table dropper throws for dependent objects'
  );
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_table_oid_cascade_fkey() RETURNS SETOF TEXT AS $$
DECLARE
  rel_id oid;
BEGIN
  rel_id := 'dropme'::regclass::oid;
  CREATE TABLE
    dependent (id SERIAL PRIMARY KEY, col1 integer REFERENCES dropme);
  PERFORM msar.drop_table(tab_id => rel_id, cascade_ => true, if_exists => false);
  RETURN NEXT hasnt_table('dropme', 'Drops table with dependent using CASCADE');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_table_name() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_table(
    sch_name => 'public',
    tab_name => 'dropme',
    cascade_ => false,
    if_exists => false
  );
  RETURN NEXT hasnt_table('dropme', 'Drops table');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_table_name_missing_if_exists() RETURNS SETOF TEXT AS $$
BEGIN
  PERFORM msar.drop_table(
    sch_name => 'public',
    tab_name => 'dropmenew',
    cascade_ => false,
    if_exists => true
  );
  RETURN NEXT has_table('dropme', 'Drops table with IF EXISTS');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_drop_table_name_missing_no_if_exists() RETURNS SETOF TEXT AS $$
BEGIN
  RETURN NEXT throws_ok(
    'SELECT msar.drop_table(''public'', ''doesntexist'', false, false);',
    '42P01',
    'table "doesntexist" does not exist',
    'Table dropper throws for missing table'
  );
END;
$$ LANGUAGE plpgsql;


-- msar.add_columns --------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION setup_add_columns() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE add_col_testable (id serial primary key, col1 integer, col2 varchar);
END;
$$ LANGUAGE plpgsql;


-- TODO: Figure out a way to parameterize these
CREATE OR REPLACE FUNCTION test_add_columns_fullspec_text() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := $j$[
      {"name": "tcol", "type": {"name": "text"}, "not_null": true, "default": "my super default"}
    ]$j$;
BEGIN
  RETURN NEXT is(
    msar.add_columns('add_col_testable'::regclass::oid, col_create_arr), '{4}'::smallint[]
  );
  RETURN NEXT col_not_null('add_col_testable', 'tcol');
  RETURN NEXT col_type_is('add_col_testable', 'tcol', 'text');
  RETURN NEXT col_default_is('add_col_testable', 'tcol', 'my super default');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_minspec_text() RETURNS SETOF TEXT AS $f$
/*
This tests the default settings. When not given, the defautl column should be nullable and have no
default value. The name should be "Column <n>", where <n> is the attnum of the added column.
*/
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "text"}}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_is_null('add_col_testable', 'Column 4');
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'text');
  RETURN NEXT col_hasnt_default('add_col_testable', 'Column 4');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_multi_default_name() RETURNS SETOF TEXT AS $f$
/*
This tests the default settings. When not given, the defautl column should be nullable and have no
default value. The name should be "Column <n>", where <n> is the attnum of the added column.
*/
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "text"}}, {"type": {"name": "numeric"}}]';
BEGIN
  RETURN NEXT is(
    msar.add_columns('add_col_testable'::regclass::oid, col_create_arr), '{4, 5}'::smallint[]
  );
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'text');
  RETURN NEXT col_type_is('add_col_testable', 'Column 5', 'numeric');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_numeric_def() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "numeric"}, "default": 3.14159}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'numeric');
  RETURN NEXT col_default_is('add_col_testable', 'Column 4', 3.14159);
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_numeric_prec() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "numeric", "options": {"precision": 3}}}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'numeric(3,0)');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_numeric_prec_scale() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := $j$[
    {"type": {"name": "numeric", "options": {"precision": 3, "scale": 2}}}
  ]$j$;
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'numeric(3,2)');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_caps_numeric() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "NUMERIC"}}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'numeric');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_varchar_length() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "varchar", "options": {"length": 128}}}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'character varying(128)');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_interval_precision() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "interval", "options": {"precision": 6}}}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'interval(6)');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_interval_fields() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "interval", "options": {"fields": "year"}}}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'interval year');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_interval_fields_prec() RETURNS SETOF TEXT AS $f$
DECLARE
  col_create_arr jsonb := $j$
    [{"type": {"name": "interval", "options": {"fields": "second", "precision": 3}}}]
  $j$;
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'interval second(3)');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_timestamp_raw_default() RETURNS SETOF TEXT AS $f$
/*
This test will fail if the default is being sanitized, but will succeed if it's not.
*/
DECLARE
  col_create_arr jsonb := '[{"type": {"name": "timestamp"}, "default": "now()::timestamp"}]';
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr, raw_default => true);
  RETURN NEXT col_type_is('add_col_testable', 'Column 4', 'timestamp without time zone');
  RETURN NEXT col_default_is(
    'add_col_testable', 'Column 4', '(now())::timestamp without time zone'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_sanitize_default() RETURNS SETOF TEXT AS $f$
/*
This test will succeed if the default is being sanitized, but will fail if it's not.

It's important to check that we're careful with SQL submitted from python.
*/
DECLARE
  col_create_arr jsonb := $j$
    [{"type": {"name": "text"}, "default": "null; drop table add_col_testable"}]
  $j$;
BEGIN
  PERFORM msar.add_columns('add_col_testable'::regclass::oid, col_create_arr, raw_default => false);
  RETURN NEXT has_table('add_col_testable');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_columns_errors() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_columns(tab_id => %s, col_defs => ''%s'');',
      'add_col_testable'::regclass::oid,
      '[{"type": {"name": "taxt"}}]'::jsonb
    ),
    '42704',
    'type "taxt" does not exist'
  );
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_columns(tab_id => %s, col_defs => ''%s'');',
      'add_col_testable'::regclass::oid,
      '[{"type": {"name": "text", "options": {"length": 234}}}]'::jsonb
    ),
    '42601',
    'type modifier is not allowed for type "text"'
  );
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_columns(tab_id => %s, col_defs => ''%s'');',
      'add_col_testable'::regclass::oid,
      '[{"type": {"name": "numeric", "options": {"scale": 23, "precision": 3}}}]'::jsonb
    ),
    '22023',
    'NUMERIC scale 23 must be between 0 and precision 3'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION setup_add_pkey() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE add_pkeytest (col1 serial, col2 serial, col3 text);
  INSERT INTO add_pkeytest (col1, col2, col3) VALUES
    (DEFAULT, DEFAULT, 'abc'),
    (DEFAULT, DEFAULT, 'def'),
    (DEFAULT, DEFAULT, 'abc'),
    (DEFAULT, DEFAULT, 'def'),
    (DEFAULT, DEFAULT, 'abc'),
    (DEFAULT, DEFAULT, 'def'),
    (DEFAULT, DEFAULT, 'abc');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_id_fullspec() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := $j$[
    {"name": "mysuperkey", "type": "p", "columns": [1], "deferrable": true}
  ]$j$;
  created_name text;
  deferrable_ boolean;
BEGIN
  PERFORM msar.add_constraints('add_pkeytest'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', 'col1');
  created_name := conname FROM pg_constraint
    WHERE conrelid='add_pkeytest'::regclass::oid AND conkey='{1}';
  RETURN NEXT is(created_name, 'mysuperkey');
  deferrable_ := condeferrable FROM pg_constraint WHERE conname='mysuperkey';
  RETURN NEXT is(deferrable_, true);
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_id_defname() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": [1]}]';
  created_name text;
BEGIN
  PERFORM msar.add_constraints('add_pkeytest'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', 'col1');
  created_name := conname FROM pg_constraint
    WHERE conrelid='add_pkeytest'::regclass::oid AND conkey='{1}';
  RETURN NEXT is(created_name, 'add_pkeytest_pkey');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_id_multicol() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": [1, 2]}]';
  created_name text;
BEGIN
  PERFORM msar.add_constraints('add_pkeytest'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', ARRAY['col1', 'col2']);
  created_name := conname FROM pg_constraint
    WHERE conrelid='add_pkeytest'::regclass::oid AND conkey='{1, 2}';
  RETURN NEXT is(created_name, 'add_pkeytest_pkey');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_tab_name_singlecol() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": [1]}]';
BEGIN
  PERFORM msar.add_constraints('public', 'add_pkeytest', con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', 'col1');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_col_name_singlecol() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": ["col1"]}]';
BEGIN
  PERFORM msar.add_constraints('add_pkeytest'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', 'col1');
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_col_name_multicol() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": ["col1", "col2"]}]';
BEGIN
  PERFORM msar.add_constraints('add_pkeytest'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', ARRAY['col1', 'col2']);
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_pkey_col_mix_multicol() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": [1, "col2"]}]';
BEGIN
  PERFORM msar.add_constraints('add_pkeytest'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_pk('add_pkeytest', ARRAY['col1', 'col2']);
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION setup_add_fkey() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE add_fk_users (id serial primary key, fname TEXT, lname TEXT, phoneno TEXT);
  INSERT INTO add_fk_users (fname, lname, phoneno) VALUES
    ('alice', 'smith', '123 4567'),
    ('bob', 'jones', '234 5678'),
    ('eve', 'smith', '345 6789');
  CREATE TABLE add_fk_comments (id serial primary key, user_id integer, comment text);
  INSERT INTO add_fk_comments (user_id, comment) VALUES
    (1, 'aslfkjasfdlkjasdfl'),
    (2, 'aslfkjasfdlkjasfl'),
    (3, 'aslfkjasfdlkjsfl'),
    (1, 'aslfkjasfdlkasdfl'),
    (2, 'aslfkjasfkjasdfl'),
    (2, 'aslfkjasflkjasdfl'),
    (3, 'aslfkjasfdjasdfl'),
    (1, 'aslfkjasfkjasdfl'),
    (1, 'fkjasfkjasdfl');
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_fkey_id_fullspec() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb;
BEGIN
  con_create_arr := format(
    $j$[
      {
        "name": "superfkey",
        "type": "f",
        "columns": [2],
        "fkey_relation_id": %s,
        "fkey_columns": [1],
        "fkey_update_action": "a",
        "fkey_delete_action": "a",
        "fkey_match_type": "f"
      }
    ]$j$, 'add_fk_users'::regclass::oid
  );
  PERFORM msar.add_constraints('add_fk_comments'::regclass::oid, con_create_arr);
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
  RETURN NEXT results_eq(
    $h$
    SELECT conname, confupdtype, confdeltype, confmatchtype
    FROM pg_constraint WHERE conname='superfkey'
    $h$,
    $w$VALUES ('superfkey'::name, 'a'::"char", 'a'::"char", 'f'::"char")$w$
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION fkey_options_eq("char", "char", "char") RETURNS TEXT AS $f$
DECLARE
  con_create_arr jsonb;
BEGIN
  con_create_arr := format(
    $j$[
      {
        "name": "superfkey",
        "type": "f",
        "columns": [2],
        "fkey_relation_id": %s,
        "fkey_update_action": "%s",
        "fkey_delete_action": "%s",
        "fkey_match_type": "%s"
      }
    ]$j$,
    'add_fk_users'::regclass::oid, $1, $2, $3
  );
  PERFORM msar.add_constraints('add_fk_comments'::regclass::oid, con_create_arr);
  RETURN results_eq(
    $h$
    SELECT conname, confupdtype, confdeltype, confmatchtype
    FROM pg_constraint WHERE conname='superfkey'
    $h$,
    format(
      $w$VALUES ('superfkey'::name, '%s'::"char", '%s'::"char", '%s'::"char")$w$,
      $1, $2, $3
    ),
    format('Should have confupdtype %s, confdeltype %s, and confmatchtype %s', $1, $2, $3)
  );
END;
$f$ LANGUAGE plpgsql;


-- Options for fkey delete, update action and match type
-- a = no action, r = restrict, c = cascade, n = set null, d = set default
-- f = full, s = simple
-- Note that partial match is not implemented.


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_aas() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('a', 'a', 's');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_arf() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('a', 'r', 'f');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_rrf() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('r', 'r', 'f');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_rrf() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('r', 'r', 'f');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_ccf() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('c', 'c', 'f');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_nnf() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('n', 'n', 'f');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraints_fkey_opts_ddf() RETURNS SETOF TEXT AS $f$
BEGIN
  RETURN NEXT fkey_options_eq('d', 'd', 'f');
  RETURN NEXT fk_ok(
    'public', 'add_fk_comments', 'user_id', 'public', 'add_fk_users', 'id'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION setup_add_unique() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE add_unique_con (id serial primary key, col1 integer, col2 integer, col3 integer);
  INSERT INTO add_unique_con (col1, col2, col3) VALUES
    (1, 1, 1),
    (2, 2, 3),
    (3, 3, 3);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION  test_add_constraints_unique_multicol() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"name": "myuniqcons", "type": "u", "columns": [2, 3]}]';
BEGIN
  PERFORM msar.add_constraints('add_unique_con'::regclass::oid, con_create_arr);
  RETURN NEXT col_is_unique('add_unique_con', ARRAY['col1', 'col2']);
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_duplicate_name() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"name": "myuniqcons", "type": "u", "columns": [2]}]';
  con_create_arr2 jsonb := '[{"name": "myuniqcons", "type": "u", "columns": [3]}]';
BEGIN
  PERFORM msar.add_constraints('add_unique_con'::regclass::oid, con_create_arr);
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_constraints(%s, ''%s'');', 'add_unique_con'::regclass::oid, con_create_arr
    ),
    '42P07',
    'relation "myuniqcons" already exists',
    'Throws error for duplicate constraint name'
  );
END;
$f$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_add_constraint_errors() RETURNS SETOF TEXT AS $f$
DECLARE
  con_create_arr jsonb := '[{"type": "p", "columns": [7]}]'::jsonb;
BEGIN
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_constraints(%s, ''%s'');',
      'add_pkeytest'::regclass::oid,
      '[{"type": "p", "columns": [7]}]'::jsonb
    ),
    '42601',
    'syntax error at end of input',
    'Throws error for nonexistent attnum'
  );
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_constraints(%s, ''%s'');', 234, '[{"type": "p", "columns": [1]}]'::jsonb
    ),
    '42601',
    'syntax error at or near "234"',
    'Throws error for nonexistent table ID'
  );
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_constraints(%s, ''%s'');',
      'add_pkeytest'::regclass::oid,
      '[{"type": "k", "columns": [1]}]'::jsonb
    ),
    '42601',
    'syntax error at end of input',
    'Throws error for nonexistent constraint type'
  );
  RETURN NEXT throws_ok(
    format(
      'SELECT msar.add_constraints(%s, ''%s'');',
      'add_pkeytest'::regclass::oid,
      '[{"type": "p", "columns": [1, "col1"]}]'::jsonb
    ),
    '42701',
    'column "col1" appears twice in primary key constraint',
    'Throws error for nonexistent duplicate pkey col'
  );
END;
$f$ LANGUAGE plpgsql;
