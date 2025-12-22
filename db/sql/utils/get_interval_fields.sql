/*
Return the string giving the fields for an interval typmod integer.

This logic is ported from the relevant PostgreSQL source code, reimplemented in SQL. See the
`intervaltypmodout` function at
https://doxygen.postgresql.org/backend_2utils_2adt_2timestamp_8c.html

Args:
  typ_mod: The atttypmod from the pg_attribute table. Should be valid for the interval type.
*/

CREATE OR REPLACE FUNCTION
pg_temp.get_interval_fields(typ_mod integer) RETURNS text AS $$
SELECT CASE (typ_mod >> 16 & 32767)
  WHEN 1 << 2 THEN 'year'
  WHEN 1 << 1 THEN 'month'
  WHEN 1 << 3 THEN 'day'
  WHEN 1 << 10 THEN 'hour'
  WHEN 1 << 11 THEN 'minute'
  WHEN 1 << 12 THEN 'second'
  WHEN (1 << 2) | (1 << 1) THEN 'year to month'
  WHEN (1 << 3) | (1 << 10) THEN 'day to hour'
  WHEN (1 << 3) | (1 << 10) | (1 << 11) THEN 'day to minute'
  WHEN (1 << 3) | (1 << 10) | (1 << 11) | (1 << 12) THEN 'day to second'
  WHEN (1 << 10) | (1 << 11) THEN 'hour to minute'
  WHEN (1 << 10) | (1 << 11) | (1 << 12) THEN 'hour to second'
  WHEN (1 << 11) | (1 << 12) THEN 'minute to second'
END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;
