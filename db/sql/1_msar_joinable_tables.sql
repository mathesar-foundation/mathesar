/*
This script sets up a framework for determining which tables are joinable to a given table
automatically.

A table is 'joinable' to another in this context if it can be reached by following a sequence of
foreign key links from the original table.

This is NOT YET USED in the python layer.

A Join Path is an array of arrays of arrays:

[
  [[L_oid0, L_attnum0], [R_oid0, R_attnum0]],
  [[L_oid1, L_attnum1], [R_oid1, R_attnum1]],
  [[L_oid2, L_attnum2], [R_oid2, R_attnum2]],
  ...
]

Here, [L_oidN, L_attnumN] represents the left column of a join, and [R_oidN, R_attnumN] the right.

A Foreign Key path gives the same information in a different form:
[
    [constraint_id0, reversed],
    [constraint_id1, reversed],
]

In this form, `constraint_idN` is a foreign key constraint, and `reversed` is a boolean giving
whether to travel from referrer to referant (when False) or from referant to referrer (when True).
*/


CREATE TYPE mathesar_types.joinable_tables AS (
  base integer, -- The OID of the table from which the paths start
  target integer, -- The OID of the table where the paths end
  join_path jsonb, -- A JSONB array of arrays of arrays
  fkey_path jsonb,
  depth integer,
  multiple_results boolean
);


CREATE OR REPLACE FUNCTION
msar.get_joinable_tables(max_depth integer) RETURNS SETOF mathesar_types.joinable_tables AS $$/*
This function returns a table of mathesar_types.joinable_tables objects, giving paths to various
joinable tables.

Args:
  max_depth: This controls how far to search for joinable tables.

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
    false multiple_results,
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
    true multiple_results,
    true reversed
  FROM pg_constraint c
  WHERE c.contype='f' and array_length(c.conkey, 1)=1
),

search_fkey_graph(
    left_rel, right_rel, left_col, right_col, depth, join_path, fkey_path, multiple_results
) AS (
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
    jsonb_build_array(jsonb_build_array(sfk.fkey_oid, sfk.reversed)),
    sfk.multiple_results
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
    fkey_path || jsonb_build_array(jsonb_build_array(sfk.fkey_oid, sfk.reversed)),
    sg.multiple_results OR sfk.multiple_results
  FROM symmetric_fkeys sfk, search_fkey_graph sg
  WHERE
    sfk.left_rel=sg.right_rel
    AND depth<max_depth
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
    depth,
    multiple_results
  FROM search_fkey_graph
)
SELECT * FROM output_cte;
$$ LANGUAGE sql;


CREATE OR REPLACE FUNCTION
msar.get_joinable_tables(max_depth integer, table_id oid) RETURNS
  SETOF mathesar_types.joinable_tables AS $$
  SELECT * FROM msar.get_joinable_tables(max_depth) WHERE base=table_id
$$ LANGUAGE sql;
