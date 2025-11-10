CREATE OR REPLACE FUNCTION pg_temp.get_constraints_for_table(tab_id oid) RETURNS TABLE
(
  oid oid,
  name text,
  type text,
  columns smallint[],
  referent_table_oid oid,
  referent_columns smallint[]
)
AS $$
WITH constraints AS (
  SELECT
    oid,
    conname AS name,
    pg_temp.get_constraint_type_api_code(contype::char) AS type,
    conkey AS columns,
    confrelid AS referent_table_oid,
    confkey AS referent_columns
  FROM pg_catalog.pg_constraint
  WHERE conrelid = tab_id
)
SELECT *
FROM constraints
-- Only return constraints with types that we're able to classify
WHERE type IS NOT NULL
$$ LANGUAGE SQL;
