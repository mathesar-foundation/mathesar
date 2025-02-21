DROP PROCEDURE if exists raise_notice;
CREATE OR REPLACE PROCEDURE raise_notice(notice text) AS $$
BEGIN
  RAISE NOTICE '%', notice;
END;
$$ LANGUAGE plpgsql;

CALL raise_notice('Creating testing DB');
CREATE DATABASE mathesar_testing;
\c mathesar_testing
\ir 00_msar_all_objects_table.sql
\ir 01_msar_types.sql
\ir 02_msar_remove.sql
\ir 05_msar.sql
\ir 10_msar_joinable_tables.sql
\ir 30_msar_custom_aggregates.sql
\ir 45_msar_type_casting.sql
\ir 50_msar_permissions.sql
\ir test_sql_functions.sql
