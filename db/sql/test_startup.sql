RAISE NOTICE '%', 'Creating testing DB';
CREATE DATABASE mathesar_testing;
\c mathesar_testing
\ir 0_msar.sql
\ir test_0_msar.sql
