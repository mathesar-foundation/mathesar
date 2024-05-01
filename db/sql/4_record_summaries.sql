/*
This script provides helper functions for dealing with record summaries and record summary
templates.
*/


CREATE OR REPLACE FUNCTION
msar.build_record_summary_query_from_template(
  tab_id oid,
  template jsonb
) RETURNS text AS $$/*
  Given a table OID and a record summary template, this function returns a query that can be used to
  generate record summaries for the table.

  Args:
    tab_id: The OID of the table for which to generate a record summary query.
    template: A JSON array that represents the record summary template (described in detail below).
    
  Example template:

    [
      "#",
      [1],
      " - ",
      [2, 5],
      " - ",
      [2, 5, 10]
    ]

  A string entry in the template represents static text to be included in the record summary
  verbatim.

  An array entry in the template represents a reference to data. Each element in the array is a
  column attnum. The first column attnum refers to a column in the base table. If the array
  contains more than one column reference, it represents a chain of FK columns starting from
  the base table and ending with a non-FK column. Foreign keys should be followed to produce the
  joins. Multi-column FK constraints are not supported.
  
  RETURN VALUE:
  
  The query returned by this function has the following columns:
    id: The primary key column of the table. (This is always named `id`, even if the PK within
      the table has a different name.)
    record_summary: A string that represents the record summary.
*/
DECLARE
  base_alias CONSTANT text := 'base';
  expr_parts text[];
  expr text;
  base_tab_fqn text := __msar.get_relation_name(tab_id);
  base_pk_name text := msar.get_column_name(tab_id, msar.get_pk_column(tab_id));
  template_part jsonb;
  join_clauses text[] := ARRAY[]::text[];
  join_section text;
BEGIN
  IF base_tab_fqn IS NULL THEN
    -- TODO: the test above won't work because `get_relation_name` returns a stringified number if the table doesn't exist
    RAISE EXCEPTION 'Unable to find table with oid %.', tab_id;
  END IF;
  IF base_pk_name IS NULL THEN
    RAISE EXCEPTION 'Unable to find primary key column for table with oid %.', tab_id;
  END IF;
  IF jsonb_typeof(template) <> 'array' THEN
    RAISE EXCEPTION 'Record summary template must be a JSON array.';
  END IF;

  <<template_parts_loop>>
  FOR template_part IN SELECT jsonb_array_elements(template) LOOP
    DECLARE
      ref_chain smallint[] := __msar.extract_smallints(template_part);
      ref_chain_length integer := array_length(ref_chain, 1);
      fk_col_id smallint;
      contextual_tab_id oid := tab_id;
      prev_alias text := base_alias;
      ref_column_name text;
    BEGIN
      -- Column reference template parts
      IF ref_chain_length > 0 THEN
        -- Except for the final ref_chain element, process all array elements as attnums of FK
        -- columns.
        FOREACH fk_col_id IN ARRAY ref_chain[1:ref_chain_length-1] LOOP
          DECLARE
            fk_col_name text := msar.get_column_name(contextual_tab_id, fk_col_id);
            ref_tab_id oid;
            ref_col_id smallint;
            ref_tab_fqn text;
            ref_col_name text;
            alias text;
            join_clause text;
          BEGIN
            IF fk_col_name IS NULL THEN
              -- Silently ignore references to non-existing columns. This can happen if a column
              -- has been deleted.
              CONTINUE template_parts_loop;
            END IF;

            SELECT confrelid, confkey[1] INTO ref_tab_id, ref_col_id
            FROM pg_catalog.pg_constraint
            WHERE contype = 'f' AND conrelid = contextual_tab_id AND conkey = array[fk_col_id];

            IF ref_tab_id IS NULL THEN
              -- Silently ignore references to non-FK columns. This can happen if the constraint
              -- has been dropped.
              CONTINUE template_parts_loop;
            END IF;

            ref_tab_fqn := __msar.get_relation_name(ref_tab_id);
            ref_col_name := msar.get_column_name(ref_tab_id, ref_col_id);
            alias := concat(prev_alias, '_', fk_col_id);
            join_clause := concat(
              'LEFT JOIN ',  ref_tab_fqn, ' AS ', alias,
              ' ON ', alias, '.', ref_col_name, ' = ', prev_alias, '.', fk_col_name
            );

            IF NOT join_clauses @> ARRAY[join_clause] THEN
              join_clauses := array_append(join_clauses, join_clause);
            END IF;
            prev_alias := alias;
            contextual_tab_id := ref_tab_id;
          END;
        END LOOP;

        ref_column_name := msar.get_column_name(contextual_tab_id, ref_chain[ref_chain_length]);
        expr_parts := array_append(expr_parts, concat(prev_alias, '.', ref_column_name));

      -- String literal template parts
      ELSIF jsonb_typeof(template_part) = 'string' THEN
        expr_parts := array_append(expr_parts, quote_literal(template_part #>> '{}'));
      END IF;
    END;
  END LOOP;

  IF array_length(expr_parts, 1) = 0 THEN
    -- If the template didn't give us anything to render, then we show '?' as a fallback. This can
    -- happen if (e.g.) the template only contains a reference which is no longer valid due to a
    -- column being deleted.
    expr_parts := array_append(expr_parts, quote_literal('?'));
  END IF;

  join_section := CASE
    WHEN array_length(join_clauses, 1) = 0 THEN ''
    ELSE chr(10) || array_to_string(join_clauses, chr(10))
  END;

  expr := array_to_string(expr_parts, E'\n    || ');

  RETURN concat(
    'SELECT ', chr(10),
    '  ', base_alias, '.', base_pk_name, ' AS id, ', chr(10),
    '  ', expr, ' AS record_summary', chr(10),
    'FROM ', base_tab_fqn, ' AS ', base_alias,
    join_section
  );

  -- TODO:
  -- - Handle columns which can't be automatically cast to TEXT
END;
$$ LANGUAGE plpgsql;
