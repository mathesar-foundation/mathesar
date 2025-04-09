CREATE OR REPLACE FUNCTION
msar.find_numeric_separators(
  tab_id regclass,
  col_id smallint,
  test_perc numeric
) RETURNS jsonb AS $$/*
Given a table column, find group and decimal separators for number values in the column.

Throws an error if more than one group separator or decimal separator is found.

Returns:

{
  "group_sep": Optional[str],
  "decimal_p": Optional[str]
}
*/
DECLARE
  separators jsonb;
BEGIN
EXECUTE format(
  $q$
  WITH numarr_cte AS (
    SELECT msar.get_numeric_array(%1$I) as n FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L)
  )
  SELECT jsonb_build_object(
    'group_sep', jsonb_agg_strict(DISTINCT n[2]), 'decimal_p', jsonb_agg_strict(DISTINCT n[3])
  ) FROM numarr_cte;
  $q$,
  msar.get_column_name(tab_id, col_id),
  msar.get_relation_schema_name(tab_id),
  msar.get_relation_name(tab_id),
  test_perc
) INTO separators;
IF jsonb_array_length(separators -> 'group_sep') > 1 THEN
  RAISE EXCEPTION 'Too many grouping separators found!';
ELSIF jsonb_array_length(separators -> 'decimal_p') > 1 THEN
  RAISE EXCEPTION 'Too many decimal separators found!';
ELSE
  RETURN jsonb_build_object(
    'group_sep', separators -> 'group_sep' ->> 0,
    'decimal_p', separators -> 'decimal_p' ->> 0
  );
END IF;
END;
$$ LANGUAGE plpgsql PARALLEL SAFE STABLE RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.downsize_table_sample(test_perc numeric) RETURNS numeric AS $$
  SELECT (test_perc / 100) ^ 2 * 100
END;
$$ LANGUAGE SQL PARALLEL SAFE IMMUTABLE RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.check_column_numeric_compat(
  tab_id regclass, col_id smallint, test_perc numeric
) RETURNS jsonb AS $$
DECLARE
  separators jsonb;
BEGIN
  separators = msar.find_numeric_separators(tab_id, col_id, msar.downsize_table_sample(test_perc));
  EXECUTE format(
    'SELECT msar.cast_to_numeric(%1$I, %5$L, %6$L) FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L);',
    msar.get_column_name(tab_id, col_id),
    msar.get_relation_schema_name(tab_id),
    msar.get_relation_name(tab_id),
    test_perc,
    coalesce(separators ->> 'group_sep', ''),
    coalesce(separators ->> 'decimal_p', '')
  );
  RETURN jsonb_build_object(
    'mathesar_casting', true,
    'group_sep', separators ->> 'group_sep',
    'decimal_p', separators ->> 'decimal_p',
    'type_compatible', true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('type_compatible', false);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.check_column_type_compat(
  tab_id regclass, col_id smallint, typ_id regtype, test_perc numeric
) RETURNS jsonb AS $$/*
Get info about the compatibility of a given type for a given column.

Args:
  tab_id: The OID of the table whose column we're checking.
  col_id: The attnum of the column in the table.
  typ_id: The OID of the type we'll check against the column.
  test_perc: The percentage of the table to use for the `cast_to_X` default check.

Returns a JSONB describing the compatibility of the type for the column with the keys:
  mathesar_casting: (bool): This is whether our custom casting function succeeded.
  type_compatible (bool): This is a simple one-shot boolean that tells us whether to infer the
                          column is that type in inference algorithms.
*/
BEGIN
  CASE typ_id
    WHEN 'numeric'::regtype THEN
      RETURN msar.check_column_numeric_compat(tab_id, col_id, test_perc);
    ELSE
      EXECUTE format(
        'SELECT %1$s FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L);',
        msar.build_cast_expr(tab_id, col_id, typ_id),
        msar.get_relation_schema_name(tab_id),
        msar.get_relation_name(tab_id),
        test_perc
      );
      RETURN jsonb_build_object('mathesar_casting', true, 'type_compatible', true);
  END CASE;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('mathesar_casting', false, 'type_compatible', false);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.infer_column_data_type(
  tab_id regclass, col_id smallint, test_perc numeric DEFAULT 100
) RETURNS regtype AS $$/*
Infer the best type for a given column.

Note that we currently only try for `text` columns, since we only do this at import. I.e.,
if the column is some other type we just return that original type.

Args:
  tab_id: The OID of the table of the column whose type we're inferring.
  col_id: The attnum of the column whose type we're inferring.
*/
DECLARE
  inferred_type regtype;
  infer_sequence_raw text[] := ARRAY[
    'boolean',
    'date',
    'numeric',
    'uuid',
    'timestamp without time zone',
    'timestamp with time zone',
    'time without time zone',
    'interval',
    'mathesar_types.email',
    'mathesar_types.mathesar_json_array',
    'mathesar_types.mathesar_json_object',
    'mathesar_types.uri'
  ];
  infer_sequence regtype[];
  column_nonempty boolean;
  test_type regtype;
BEGIN
  infer_sequence := array_agg(pg_catalog.to_regtype(t))
    FILTER (WHERE pg_catalog.to_regtype(t) IS NOT NULL)
    FROM unnest(infer_sequence_raw) AS x(t);
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM %1$I.%2$I WHERE %3$I IS NOT NULL)',
    msar.get_relation_schema_name(tab_id),
    msar.get_relation_name(tab_id),
    msar.get_column_name(tab_id, col_id)
  ) INTO column_nonempty;
  inferred_type := atttypid FROM pg_catalog.pg_attribute WHERE attrelid=tab_id AND attnum=col_id;
  IF inferred_type <> 'text'::regtype OR NOT column_nonempty THEN
    RETURN inferred_type;
  END IF;
  FOREACH test_type IN ARRAY infer_sequence
    LOOP
      IF msar.check_column_type_compat(tab_id, col_id, test_type, test_perc)
          -> 'type_compatible' THEN
        inferred_type := test_type;
        EXIT;
      END IF;
    END LOOP;
  RETURN inferred_type;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.infer_table_column_data_types(tab_id regclass) RETURNS jsonb AS $$/*
Infer the best type for each column in the table.

Currently we only suggest different types for columns which originate as type `text`.

Args:
  tab_id: The OID of the table whose columns we're inferring types for.

The response JSON will have attnum keys, and values will be the result of `format_type`
for the inferred type of each column. Restricted to columns to which the user has access.

For tables with at most 9900 rows, we infer based on entire row set. For tables with more rows, we
decrease the percentage used to maintain an inference row set of 9,900-10,000 rows, down to a
minimum of 5% of the rows. This increases the performance of inference on large tables, at the cost
of possibly misidentifying the type of a column.

| row count  | perc |
|------------+------|
|   <= 9,900 | 100% |
|     19,900 |  50% |
|     39,900 |  25% |
|     99,900 |  10% |
| >= 199,900 |   5% |
*/
DECLARE
  test_perc integer;
BEGIN
EXECUTE(
  format(
    'SELECT GREATEST(LEAST(10000 / (COUNT(1) + 1), 100), 5) FROM %1$I.%2$I TABLESAMPLE SYSTEM(1)',
    msar.get_relation_schema_name(tab_id),
    msar.get_relation_name(tab_id)
  )
) INTO test_perc;
RETURN jsonb_object_agg(
  attnum,
  pg_catalog.format_type(msar.infer_column_data_type(attrelid, attnum, test_perc), null)
)
FROM pg_catalog.pg_attribute
WHERE
  attrelid = tab_id
  AND attnum > 0
  AND NOT attisdropped
  AND has_column_privilege(attrelid, attnum, 'SELECT');
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
