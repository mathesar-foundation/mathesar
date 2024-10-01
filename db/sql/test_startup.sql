DROP PROCEDURE if exists raise_notice;
CREATE OR REPLACE PROCEDURE raise_notice(notice text) AS $$
BEGIN
  RAISE NOTICE '%', notice;
END;
$$ LANGUAGE plpgsql;

CALL raise_notice('Creating testing DB');
CREATE DATABASE mathesar_testing;
\c mathesar_testing
\ir 00_msar.sql
\ir test_00_msar.sql
\ir 40_record_summaries.sql
\ir test_40_record_summaries.sql
