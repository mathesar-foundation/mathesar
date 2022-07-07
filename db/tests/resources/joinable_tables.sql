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
    c.oid fkey_oid,
    c.conrelid::INTEGER left_rel,
    c.confrelid::INTEGER right_rel,
    c.conkey[1]::INTEGER left_col,
    c.confkey[1]::INTEGER right_col,
    false reversed
  FROM pg_constraint c
  WHERE c.contype='f' and array_length(c.conkey, 1)=1
UNION ALL
  SELECT
    c.oid fkey_oid,
    c.confrelid::INTEGER left_rel,
    c.conrelid::INTEGER right_rel,
    c.confkey[1]::INTEGER left_col,
    c.conkey[1]::INTEGER right_col,
    true reversed
  FROM pg_constraint c
  WHERE c.contype='f' and array_length(c.conkey, 1)=1
),

search_fkey_graph(left_rel, right_rel, left_col, right_col, depth, join_path, fkey_path) AS (
  SELECT
    sfk.left_rel,
    sfk.right_rel,
    sfk.left_col,
    sfk.right_col,
    1,
    jsonb_build_array(
      jsonb_build_array(
        jsonb_build_array(sfk.left_rel, sfk.left_col),
        jsonb_build_array(sfk.right_rel, sfk.right_col)
      )
    ),
    jsonb_build_array(jsonb_build_array(sfk.fkey_oid, sfk.reversed))
  FROM symmetric_fkeys sfk
UNION ALL
  SELECT
    sfk.left_rel,
    sfk.right_rel,
    sfk.left_col,
    sfk.right_col,
    sg.depth + 1,
    join_path || jsonb_build_array(
      jsonb_build_array(
        jsonb_build_array(sfk.left_rel, sfk.left_col),
        jsonb_build_array(sfk.right_rel, sfk.right_col)
      )
    ),
    fkey_path || jsonb_build_array(jsonb_build_array(sfk.fkey_oid, sfk.reversed))
  FROM symmetric_fkeys sfk, search_fkey_graph sg
  WHERE
    sfk.left_rel=sg.right_rel
    AND depth<3
    AND (join_path -> -1) != jsonb_build_array(
      jsonb_build_array(sfk.right_rel, sfk.right_col),
      jsonb_build_array(sfk.left_rel, sfk.left_col)
    )
), output_cte AS (
  SELECT
    (join_path#>'{0, 0, 0}')::INTEGER base,
    (join_path#>'{-1, -1, 0}')::INTEGER target,
    join_path,
    fkey_path,
    depth
  FROM search_fkey_graph
)
SELECT * FROM output_cte;
