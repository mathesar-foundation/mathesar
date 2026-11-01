\ir 05_msar.sql
\ir 10_msar_joinable_tables.sql
\ir 30_msar_custom_aggregates.sql
\ir 45_msar_type_casting.sql
\ir 46_msar_type_inference.sql
GRANT SELECT ON ALL TABLES IN SCHEMA pg_temp TO PUBLIC;
\ir test_sql_functions.sql
SELECT * FROM runtests();
