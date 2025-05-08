CREATE TYPE msar.type_compat_details AS (
  type_compatible boolean,
  mathesar_casting boolean,
  group_sep "char",
  decimal_p "char",

  -- mathesar_money specific attributes
  curr_pref text,
  curr_suff text
);

CREATE OR REPLACE FUNCTION
msar.find_numeric_separators(
  tab_id regclass,
  col_id smallint,
  test_perc numeric,
  OUT compat_details msar.type_compat_details
) AS $$/*
Given a table column, find group and decimal separators for number values in the column.

Throws an error if more than one group separator or decimal separator is found.
*/
DECLARE
  group_sep text[];
  decimal_p text[];
BEGIN
EXECUTE format(
  $q$
  WITH numarr_cte AS (
    SELECT msar.get_numeric_array(%1$I) AS n FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L)
  )
  SELECT array_remove(array_agg(DISTINCT n[2]), null), array_remove(array_agg(DISTINCT n[3]),  null)
  FROM numarr_cte;
  $q$,
  msar.get_column_name(tab_id, col_id),
  msar.get_relation_schema_name(tab_id),
  msar.get_relation_name(tab_id),
  test_perc
) INTO group_sep, decimal_p;
IF array_length(group_sep, 1) > 1 THEN RAISE EXCEPTION 'Too many grouping separators found!';
ELSIF array_length(decimal_p, 1) > 1 THEN RAISE EXCEPTION 'Too many decimal separators found!';
ELSE
  compat_details.group_sep := group_sep[1];
  compat_details.decimal_p := decimal_p[1];
END IF;
END;
$$ LANGUAGE plpgsql PARALLEL SAFE STABLE RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.find_mathesar_money_attrs(
  tab_id regclass,
  col_id smallint,
  test_perc numeric,
  OUT compat_details msar.type_compat_details
) AS $$/*
Given a table column, find group separators, decimal separators, currency prefixes & currency suffixes
for money values in the column.

Throws an error if more than one group separator, decimal separator, currency prefix or currency suffix is found.
*/
DECLARE
  group_sep text[];
  decimal_p text[];
  curr_pref text[];
  curr_suff text[];
BEGIN
EXECUTE format(
  $q$
  WITH moneyarr_cte AS (
    SELECT msar.get_mathesar_money_array(%1$I) AS n FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L)
  )
  SELECT
    array_remove(array_agg(DISTINCT n[2]), null),
    array_remove(array_agg(DISTINCT n[3]), null),
    array_remove(array_agg(DISTINCT n[4]), null),
    array_remove(array_agg(DISTINCT n[5]), null)
  FROM moneyarr_cte;
  $q$,
  /* %1 */ msar.get_column_name(tab_id, col_id),
  /* %2 */ msar.get_relation_schema_name(tab_id),
  /* %3 */ msar.get_relation_name(tab_id),
  /* %4 */ test_perc
) INTO group_sep, decimal_p, curr_pref, curr_suff;
IF array_length(group_sep, 1) > 1 THEN RAISE EXCEPTION 'Too many grouping separators found!';
ELSIF array_length(decimal_p, 1) > 1 THEN RAISE EXCEPTION 'Too many decimal separators found!';
ELSIF array_length(curr_pref, 1) > 1 THEN RAISE EXCEPTION 'Too many currency prefixes found!';
ELSIF array_length(curr_suff, 1) > 1 THEN RAISE EXCEPTION 'Too many currency suffixes found!';
ELSE
  compat_details.group_sep := group_sep[1];
  compat_details.decimal_p := decimal_p[1];
  compat_details.curr_pref := curr_pref[1];
  compat_details.curr_suff := curr_suff[1];
END IF;
END;
$$ LANGUAGE plpgsql PARALLEL SAFE STABLE RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.downsize_table_sample(test_perc numeric) RETURNS numeric AS $$
  SELECT (test_perc / 100) ^ 2 * 100;
$$ LANGUAGE SQL PARALLEL SAFE IMMUTABLE RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.check_column_numeric_compat(
  tab_id regclass,
  col_id smallint,
  test_perc numeric,
  OUT compat_details msar.type_compat_details
) AS $$/*
Determine whether we can cast the given column to numeric.

Args:
  tab_id: The OID of the table whose column we're checking.
  col_id: The attnum of the column in the table.
  test_perc: The percentage of the table to use for the `cast_to_X` default check.

Returns:
  Information about how to successfully cast the column to numeric.
*/
BEGIN
  compat_details = msar.find_numeric_separators(
    tab_id, col_id, msar.downsize_table_sample(test_perc)
  );
  EXECUTE format(
    'SELECT msar.cast_to_numeric(%1$I, %5$L, %6$L) FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L);',
    msar.get_column_name(tab_id, col_id),
    msar.get_relation_schema_name(tab_id),
    msar.get_relation_name(tab_id),
    test_perc,
    coalesce(compat_details.group_sep, ''),
    coalesce(compat_details.decimal_p, '')
  );
  compat_details.mathesar_casting = true;
  compat_details.type_compatible = true;
EXCEPTION WHEN OTHERS THEN END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.check_column_mathesar_money_compat(
  tab_id regclass,
  col_id smallint,
  test_perc numeric,
  OUT compat_details msar.type_compat_details
) AS $$/*
Determine whether we can cast the given column to mathesar_money.

Args:
  tab_id: The OID of the table whose column we're checking.
  col_id: The attnum of the column in the table.
  test_perc: The percentage of the table to use for the `cast_to_X` default check.

Returns:
  Information about how to successfully cast the column to mathesar_money.
*/
BEGIN
  compat_details = msar.find_mathesar_money_attrs(
    tab_id, col_id, msar.downsize_table_sample(test_perc)
  );
  EXECUTE format(
    'SELECT msar.cast_to_mathesar_money(%1$I, %5$L, %6$L, %7$L, %8$L) FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L);',
    /* %1 */ msar.get_column_name(tab_id, col_id),
    /* %2 */ msar.get_relation_schema_name(tab_id),
    /* %3 */ msar.get_relation_name(tab_id),
    /* %4 */ test_perc,
    /* %5 */ coalesce(compat_details.group_sep, ''),
    /* %6 */ coalesce(compat_details.decimal_p, ''),
    /* %7 */ coalesce(compat_details.curr_pref, ''),
    /* %8 */ coalesce(compat_details.curr_suff, '')
  );
  compat_details.mathesar_casting = true;
  compat_details.type_compatible = true;
EXCEPTION WHEN OTHERS THEN END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.check_column_type_compat(
  tab_id regclass,
  col_id smallint,
  typ_id regtype,
  test_perc numeric,
  OUT compat_details msar.type_compat_details
) AS $$/*
Get info about the compatibility of a given type for a given column.

Args:
  tab_id: The OID of the table whose column we're checking.
  col_id: The attnum of the column in the table.
  typ_id: The OID of the type we'll check against the column.
  test_perc: The percentage of the table to use for the `cast_to_X` default check.

Returns:
  Info about how to successfully cast the column to the given type.
*/
BEGIN
  CASE typ_id
    WHEN 'numeric'::regtype THEN
      compat_details = msar.check_column_numeric_compat(tab_id, col_id, test_perc);
    WHEN 'mathesar_types.mathesar_money'::regtype THEN
      compat_details = msar.check_column_mathesar_money_compat(tab_id, col_id, test_perc);
    ELSE
      EXECUTE format(
        'SELECT %1$s FROM %2$I.%3$I TABLESAMPLE SYSTEM(%4$L);',
        msar.build_cast_expr(tab_id, col_id, typ_id),
        msar.get_relation_schema_name(tab_id),
        msar.get_relation_name(tab_id),
        test_perc
      );
      compat_details.mathesar_casting = true;
      compat_details.type_compatible = true;
  END CASE;
EXCEPTION WHEN OTHERS THEN END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.infer_column_data_type(
  tab_id regclass, col_id smallint, test_perc numeric DEFAULT 100
) RETURNS jsonb AS $$/*
Infer the best type for a given column.

Note that we currently only try for `text` columns, since we only do this at import. I.e.,
if the column is some other type we just return that original type.

Args:
  tab_id: The OID of the table of the column whose type we're inferring.
  col_id: The attnum of the column whose type we're inferring.
*/
DECLARE
  inferred_type regtype;
  inferred_type_details jsonb;
  test_type_details msar.type_compat_details;
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
    'mathesar_types.mathesar_money',
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
    RETURN jsonb_build_object('type', inferred_type);
  END IF;
  FOREACH test_type IN ARRAY infer_sequence
    LOOP
      test_type_details := msar.check_column_type_compat(tab_id, col_id, test_type, test_perc);
      IF test_type_details.type_compatible THEN
        inferred_type := test_type;
        inferred_type_details := to_jsonb(test_type_details) - 'type_compatible';
        EXIT;
      END IF;
    END LOOP;
  RETURN jsonb_strip_nulls(
    jsonb_build_object('type', inferred_type, 'details', inferred_type_details)
  );
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
RETURN jsonb_object_agg(attnum, msar.infer_column_data_type(attrelid, attnum, test_perc))
FROM pg_catalog.pg_attribute
WHERE
  attrelid = tab_id
  AND attnum > 0
  AND NOT attisdropped
  AND has_column_privilege(attrelid, attnum, 'SELECT');
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
