-- Tests for pg_temp.drop_all_msar_objects (the legacy cleanup function).
-- Runs in a dedicated database (mathesar_remove_testing) created by run_tests.sh.

\ir 00_msar_all_objects_table.sql
\ir 02_msar_remove.sql

SELECT * FROM no_plan();

-- Test 1: drops msar and __msar schemas along with their objects.
-- 00 + 02 no longer create msar (table is in pg_temp now), so create
-- the schemas explicitly to simulate a legacy DB.
CREATE SCHEMA msar;
CREATE SCHEMA __msar;
SELECT pg_temp.drop_all_msar_objects(
    ARRAY['msar', '__msar'], true, false
);
SELECT hasnt_schema('msar', 'msar schema should be dropped');
SELECT hasnt_schema('__msar', '__msar schema should be dropped');

-- Test 2: idempotent via re-install. The function drops itself during
-- cleanup, so a second call must re-install 00 + 02 first.
\ir 00_msar_all_objects_table.sql
\ir 02_msar_remove.sql
SELECT lives_ok(
    $$SELECT pg_temp.drop_all_msar_objects(
        ARRAY['msar', '__msar'], true, false
    )$$,
    'second call after re-install should succeed (idempotent)'
);

-- Test 3: mathesar_types is preserved when remove_custom_types=false.
\ir 01_msar_types.sql
\ir 00_msar_all_objects_table.sql
\ir 02_msar_remove.sql
SELECT pg_temp.drop_all_msar_objects(
    ARRAY['msar', '__msar', 'mathesar_types'], false, false
);
SELECT has_schema(
    'mathesar_types',
    'mathesar_types preserved when remove_custom_types=false'
);

-- Test 4: mathesar_types is dropped when remove_custom_types=true.
-- mathesar_types still exists from test 3.
\ir 00_msar_all_objects_table.sql
\ir 02_msar_remove.sql
SELECT pg_temp.drop_all_msar_objects(
    ARRAY['msar', '__msar', 'mathesar_types'], true, false
);
SELECT hasnt_schema(
    'mathesar_types',
    'mathesar_types dropped when remove_custom_types=true'
);

-- Test 5: strict=false does not raise when a catalog type has external
-- dependents (e.g. a user table column using mathesar_types.email). The
-- loop can't drop the type, failed=true, but strict=false prevents the
-- exception and leaves the schema in place.
\ir 01_msar_types.sql
\ir 00_msar_all_objects_table.sql
\ir 02_msar_remove.sql
CREATE TABLE user_data (x mathesar_types.email);
SELECT lives_ok(
    $$SELECT pg_temp.drop_all_msar_objects(
        ARRAY['msar', '__msar', 'mathesar_types'], true, false
    )$$,
    'strict=false should not raise when catalog types have dependents'
);

SELECT * FROM finish();
