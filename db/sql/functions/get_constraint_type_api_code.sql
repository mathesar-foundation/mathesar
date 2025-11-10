CREATE OR REPLACE FUNCTION pg_temp.get_constraint_type_api_code(contype char) RETURNS TEXT AS $$
SELECT CASE contype
  WHEN 'c' THEN 'check'
  WHEN 'f' THEN 'foreignkey'
  WHEN 'p' THEN 'primary'
  WHEN 'u' THEN 'unique'
  WHEN 'x' THEN 'exclude'
END;
$$ LANGUAGE SQL;
