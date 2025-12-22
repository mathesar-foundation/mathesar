CREATE OR REPLACE FUNCTION
pg_temp.get_object_counts() RETURNS jsonb AS $$/*
Return a JSON object with counts of some objects in the database.

We exclude the mathesar-system schemas.

The objects counted are:
- total schemas, excluding Mathesar internal schemas
- total tables in the included schemas
- total rows of tables included
*/
SELECT jsonb_build_object(
  'schema_count', COUNT(DISTINCT pgn.oid),
  'table_count', COUNT(pgc.oid),
  'record_count', SUM(pgc.reltuples)
)
FROM pg_catalog.pg_namespace pgn
LEFT JOIN pg_catalog.pg_class pgc ON pgc.relnamespace = pgn.oid AND pgc.relkind = 'r'
WHERE pgn.nspname <> 'information_schema'
AND NOT (pgn.nspname = ANY(pg_temp.mathesar_system_schemas()))
AND pgn.nspname NOT LIKE 'pg_%';
$$ LANGUAGE SQL STABLE;
