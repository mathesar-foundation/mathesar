/*

This SQL query returns a table of the form

 base  | target |      path
-------+--------+---------------------------------
<oid>  | <oid>  | json array of arrays of arrays

The base and target are OIDs of a base table, and a target table that can be
joined by some combination of joins along single-column foreign key column
restrictions in either way.

*/

WITH RECURSIVE symmetric_fkeys AS (
  SELECT
    c.oid,
    c.conrelid::INTEGER left_rel,
    c.confrelid::INTEGER right_rel,
    c.conkey[1]::INTEGER left_cols,
    c.confkey[1]::INTEGER right_cols
  FROM pg_constraint c
  WHERE c.contype='f' and array_length(c.conkey, 1)=1
UNION ALL
  SELECT
    c.oid,
    c.confrelid::INTEGER left_rel,
    c.conrelid::INTEGER right_rel,
    c.confkey[1]::INTEGER left_cols,
    c.conkey[1]::INTEGER right_cols
  FROM pg_constraint c
  WHERE c.contype='f' and array_length(c.conkey, 1)=1
),

search_fkey_graph(left_rel, right_rel, left_cols, right_cols, depth, path) AS (
  SELECT
    sfk.left_rel,
    sfk.right_rel,
    sfk.left_cols,
    sfk.right_cols,
    1,
    jsonb_build_array(
      jsonb_build_array(
        jsonb_build_array(sfk.left_rel, sfk.left_cols),
        jsonb_build_array(sfk.right_rel, sfk.right_cols)
      )
    )
  FROM symmetric_fkeys sfk
UNION ALL
  SELECT
    sfk.left_rel,
    sfk.right_rel,
    sfk.left_cols,
    sfk.right_cols,
    sg.depth + 1,
    path || jsonb_build_array(
      jsonb_build_array(
        jsonb_build_array(sfk.left_rel, sfk.left_cols),
        jsonb_build_array(sfk.right_rel, sfk.right_cols)
      )
    )
  FROM symmetric_fkeys sfk, search_fkey_graph sg
  WHERE
    sfk.left_rel=sg.right_rel
    AND depth<3
    AND (path -> -1) != jsonb_build_array(
      jsonb_build_array(sfk.right_rel, sfk.right_cols),
      jsonb_build_array(sfk.left_rel, sfk.left_cols)
    )
), output_cte AS (
  SELECT
    (path#>'{0, 0, 0}')::INTEGER base,
    (path#>'{-1, -1, 0}')::INTEGER target,
    path
  FROM search_fkey_graph
)
SELECT * FROM output_cte;
