/*
Return a text array of the Mathesar System schemas.

Update this function whenever the list changes.
*/

CREATE OR REPLACE FUNCTION pg_temp.mathesar_system_schemas() RETURNS text[] AS $$
SELECT ARRAY['msar', '__msar', 'mathesar_types']
$$ LANGUAGE SQL STABLE;
