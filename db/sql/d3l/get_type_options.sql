/* Return the type options calculated from a type, typmod pair.

This function uses a number of hard-coded constants. The form of the returned object is determined
by the input type, but the keys will be a subset of:
  precision: the precision of a numeric or interval type. See PostgreSQL docs for details.
  scale: the scale of a numeric type
  fields: See PostgreSQL documentation of the `interval` type.
  length: Applies to "text" types where the user can specify the length.
  item_type: Gives the type of array members for array-types

Args:
  typ_id: an OID or valid type representing string will work here.
  typ_mod: The integer corresponding to the type options; see pg_attribute catalog table.
  typ_ndims: Used to determine whether the type is actually an array without an extra join.
*/
CREATE OR REPLACE FUNCTION
pg_temp.get_type_options(typ_id regtype, typ_mod integer, typ_ndims integer) RETURNS jsonb AS $$
SELECT nullif(
  CASE
    WHEN typ_id = ANY('{numeric, _numeric}'::regtype[]) THEN
      jsonb_build_object(
        -- This calculation is modified from the relevant PostgreSQL source code. See the function
        -- numeric_typmod_precision(int32) at
        -- https://doxygen.postgresql.org/backend_2utils_2adt_2numeric_8c.html
        'precision', ((nullif(typ_mod, -1) - 4) >> 16) & 65535,
        -- This calculation is from numeric_typmod_scale(int32) at the same location
        'scale', (((nullif(typ_mod, -1) - 4) & 2047) # 1024) - 1024
      )
    WHEN typ_id = ANY('{interval, _interval}'::regtype[]) THEN
      jsonb_build_object(
        'precision', nullif(typ_mod & 65535, 65535),
        'fields', pg_temp.get_interval_fields(typ_mod)
      )
    WHEN typ_id = ANY('{bpchar, _bpchar, varchar, _varchar}'::regtype[]) THEN
      -- For char and varchar types, the typemod is equal to 4 more than the set length.
      jsonb_build_object('length', nullif(typ_mod, -1) - 4)
    WHEN typ_id = ANY(
      '{bit, varbit, time, timetz, timestamp, timestamptz}'::regtype[]
      || '{_bit, _varbit, _time, _timetz, _timestamp, _timestamptz}'::regtype[]
    ) THEN
      -- For all these types, the typmod is equal to the precision.
      jsonb_build_object(
        'precision', nullif(typ_mod, -1)
      )
    ELSE jsonb_build_object()
  END
  || CASE
    WHEN typ_ndims>0 THEN
      -- This string wrangling is debatably dubious, but avoids a slow join.
      jsonb_build_object('item_type', rtrim(typ_id::regtype::text, '[]'))
    ELSE '{}'
  END,
  '{}'
)
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;
