/*
This script defines a number of functions to be used for manipulating database objects (tables,
columns, schemas) using Data Definition Language style queries.

These are the schemas where the new functions will generally live:

      __msar:  These functions aren't designed to be used except by other Mathesar functions.
               Generally need preformatted strings as input, won't do quoting, etc.
        msar:  These functions are designed to be used more easily. They'll format strings, quote
               identifiers, and so on.

The reason they're so abbreviated is to avoid namespace clashes, and also because making them longer
would make using them quite tedious, since they're everywhere.

The functions should each be overloaded to accept at a minimum the 'fixed' ID of a given object, as
well as its name identifer(s).

- Schemas should be identified by one of the following:
  - OID, or
  - Name
- Tables should be identified by one of the following:
  - OID, or
  - Schema, Name pair (unquoted)
- Columns should be identified by one of the following:
  - OID, ATTNUM pair, or
  - Schema, Table Name, Column Name triple (unquoted), or
  - Table OID, Column Name pair (optional).

Note that these identification schemes apply to the public-facing functions in the `msar` namespace,
not necessarily the internal `__msar` functions.

NAMING CONVENTIONS

Because function signatures are used informationally in command-generated tables, horizontal space
needs to be conserved. As a compromise between readability and terseness, we use the following
conventions in variable naming:

attribute  -> att
schema     -> sch
table      -> tab
column     -> col
constraint -> con
object     -> obj
relation   -> rel

Textual names will have the suffix _name, and numeric identifiers will have the suffix _id.

So, the OID of a table will be tab_id and the name of a column will be col_name. The attnum of a
column will be col_id.

Generally, we'll use snake_case for legibility and to avoid collisions with internal PostgreSQL
naming conventions.

*/

CREATE SCHEMA IF NOT EXISTS __msar;
CREATE SCHEMA IF NOT EXISTS msar;

----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- GENERAL DDL FUNCTIONS
--
-- Functions in this section are quite general, and are the basis of the others.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION
__msar.exec_ddl(command text) RETURNS text AS $$/*
Execute the given command, returning the command executed.

Not useful for SELECTing from tables. Most useful when you're performing DDL.

Args:
  command: Raw string that will be executed as a command.
*/
BEGIN
  EXECUTE command;
  RETURN command;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.exec_ddl(command_template text, arguments variadic anyarray) RETURNS text AS $$/*
Execute a templated command, returning the command executed.

The template is given in the first argument, and all further arguments are used to fill in the
template. Not useful for SELECTing from tables. Most useful when you're performing DDL.

Args:
  command_template: Raw string that will be executed as a command.
  arguments: arguments that will be used to fill in the template.
*/
DECLARE formatted_command TEXT;
BEGIN
  formatted_command := format(command_template, VARIADIC arguments);
  RETURN __msar.exec_ddl(formatted_command);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.build_text_tuple(text[]) RETURNS text AS $$
SELECT '(' || string_agg(col, ', ') || ')' FROM unnest($1) x(col);
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;

----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- INFO FUNCTIONS
--
-- Functions in this section get information about a given schema, table or column.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION msar.col_description(tab_id oid, col_id integer) RETURNS text AS $$/*
Transparent wrapper for col_description. Putting it in the `msar` namespace helps route all DB calls
from Python through a single Python module.
*/
  BEGIN
    RETURN col_description(tab_id, col_id);
  END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION msar.obj_description(obj_id oid, catalog_name text) RETURNS text AS $$/*
Transparent wrapper for obj_description. Putting it in the `msar` namespace helps route all DB calls
from Python through a single Python module.
*/
  BEGIN
    RETURN obj_description(obj_id, catalog_name);
  END
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION __msar.jsonb_key_exists(data jsonb, key text) RETURNS boolean AS $$/*
Wraps the `?` jsonb operator for improved readability.
*/
  BEGIN
    RETURN data ? key;
  END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION msar.schema_exists(schema_name text) RETURNS boolean AS $$/*
Return true if the given schema exists in the current database, false otherwise.
*/
SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname=schema_name);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION __msar.get_schema_oid(sch_name text) RETURNS oid AS $$/*
Return the OID of a schema, if it can be diretly found from a name.

Args :
  sch_name: The name of the schema.
*/
SELECT CASE WHEN msar.schema_exists(sch_name) THEN sch_name::regnamespace::oid END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION __msar.get_schema_name(sch_id oid) RETURNS TEXT AS $$/*
Return the name for a given schema, quoted as appropriate.

The schema *must* be in the pg_namespace table to use this function.

Args:
  sch_id: The OID of the schema.
*/
BEGIN
  RETURN sch_id::regnamespace::text;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.get_fully_qualified_object_name(sch_name text, obj_name text) RETURNS text AS $$/*
Return the fully-qualified name for a given database object (e.g., table).

Args:
  sch_name: The schema of the object, quoted.
  obj_name: The name of the object, unqualified and quoted.
*/
BEGIN
  RETURN format('%s.%s', sch_name, obj_name);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_fully_qualified_object_name(sch_name text, obj_name text) RETURNS text AS $$/*
Return the fully-qualified, properly quoted, name for a given database object (e.g., table).

Args:
  sch_name: The schema of the object, unquoted.
  obj_name: The name of the object, unqualified and unquoted.
*/
BEGIN
  RETURN __msar.get_fully_qualified_object_name(quote_ident(sch_name), quote_ident(obj_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.get_relation_name(rel_id oid) RETURNS text AS $$/*
Return the name for a given relation (e.g., table), qualified or quoted as appropriate.

In cases where the relation is already included in the search path, the returned name will not be
fully-qualified.

The relation *must* be in the pg_class table to use this function.

Args:
  rel_id: The OID of the relation.
*/
BEGIN
  RETURN rel_id::regclass::text;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_relation_name_or_null(rel_id oid) RETURNS text AS $$/*
Return the name for a given relation (e.g., table), qualified or quoted as appropriate.

In cases where the relation is already included in the search path, the returned name will not be
fully-qualified.

The relation *must* be in the pg_class table to use this function. This function will return NULL if
no corresponding relation can be found.

Args:
  rel_id: The OID of the relation.
*/
SELECT CASE
  WHEN EXISTS (SELECT oid FROM pg_catalog.pg_class WHERE oid=rel_id) THEN rel_id::regclass::text
END
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;



DROP FUNCTION IF EXISTS msar.get_relation_oid(text, text) CASCADE;
CREATE OR REPLACE FUNCTION
msar.get_relation_oid(sch_name text, rel_name text) RETURNS oid AS $$/*
Return the OID for a given relation (e.g., table).

The relation *must* be in the pg_class table to use this function.

Args:
  sch_name: The schema of the relation, unquoted.
  rel_name: The name of the relation, unqualified and unquoted.
*/
BEGIN
  RETURN msar.get_fully_qualified_object_name(sch_name, rel_name)::regclass::oid;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_relation_namespace_oid(rel_id oid) RETURNS oid AS $$/*
Get the OID of the namespace containing the given relation.

Most useful for getting the OID of the schema of a given table.

Args:
  rel_id: The OID of the relation whose namespace we want to find.
*/
SELECT relnamespace FROM pg_class WHERE oid=rel_id;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;



CREATE OR REPLACE FUNCTION
msar.get_column_name(rel_id oid, col_id integer) RETURNS text AS $$/*
Return the name for a given column in a given relation (e.g., table).

More precisely, this function returns the name of attributes of any relation appearing in the
pg_class catalog table (so you could find attributes of indices with this function).

Args:
  rel_id:  The OID of the relation.
  col_id:  The attnum of the column in the relation.
*/
SELECT quote_ident(attname::text) FROM pg_attribute WHERE attrelid=rel_id AND attnum=col_id;
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_column_name(rel_id oid, col_name text) RETURNS text AS $$/*
Return the name for a given column in a given relation (e.g., table).

More precisely, this function returns the quoted name of attributes of any relation appearing in the
pg_class catalog table (so you could find attributes of indices with this function). If the given
col_name is not in the relation, we return null.

This has the effect of both quoting and preparing the given col_name, and also validating that it
exists.

Args:
  rel_id:  The OID of the relation.
  col_name:  The unquoted name of the column in the relation.
*/
SELECT quote_ident(attname::text) FROM pg_attribute WHERE attrelid=rel_id AND attname=col_name;
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_column_names(rel_id oid, columns jsonb) RETURNS text[] AS $$/*
Return the names for given columns in a given relation (e.g., table).

- If the rel_id is given as 0, the assumption is that this is a new table, so we just apply normal
quoting rules to a column without validating anything further.
- If the rel_id is given as nonzero, and a column is given as text, then we validate that
  the column name exists in the table, and use that.
- If the rel_id is given as nonzero, and the column is given as a number, then we look the column up
  by attnum and use that name.

The columns jsonb can have a mix of numerical IDs and column names. The reason for this is that we
may be adding a column algorithmically, and this saves having to modify the column adding logic
based on the IDs passed by the user for given columns.

Args:
  rel_id:  The OID of the relation.
  columns:  A JSONB array of the unquoted names or IDs (can be mixed) of the columns.
*/
SELECT array_agg(
  CASE
    WHEN rel_id=0 THEN quote_ident(col #>> '{}')
    WHEN jsonb_typeof(col)='number' THEN msar.get_column_name(rel_id, col::integer)
    WHEN jsonb_typeof(col)='string' THEN msar.get_column_name(rel_id, col #>> '{}')
  END
)
FROM jsonb_array_elements(columns) AS x(col);
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_attnum(rel_id oid, att_name text) RETURNS smallint AS $$/*
Get the attnum for a given attribute in the relation. Returns null if no such attribute exists.

Usually, this will be used to get the attnum for a column of a table.

Args:
  rel_id: The relation where we'll look for the attribute.
  att_name: The name of the attribute, unquoted.
*/
SELECT attnum FROM pg_attribute WHERE attrelid=rel_id AND attname=att_name;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.is_pkey_col(rel_id oid, col_id integer) RETURNS boolean AS $$/*
Return whether the given column is in the primary key of the given relation (e.g., table).

Args:
  rel_id:  The OID of the relation.
  col_id:  The attnum of the column in the relation.
*/
BEGIN
  RETURN ARRAY[col_id::smallint] <@ conkey FROM pg_constraint WHERE conrelid=rel_id and contype='p';
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.is_default_possibly_dynamic(tab_id oid, col_id integer) RETURNS boolean AS $$/*
Determine whether the default value for the given column is an expression or constant.

If the column default is an expression, then we return 'True', since that could be dynamic. If the
column default is a simple constant, we return 'False'. The check is not very sophisticated, and
errs on the side of returning 'True'. We simply pull apart the pg_node_tree representation of the
expression, and check whether the root node is a known function call type. Note that we do *not*
search any deeper in the tree than the root node. This means we won't notice that some expressions
are actually constant (or at least static), if they have a function call or operator as their root
node.

For example, the following would return 'True', even though they're not dynamic:
  3 + 5
  mathesar_types.cast_to_integer('8')

Args:
  tab_id: The OID of the table with the column.
  col_id: The attnum of the column in the table.
*/
SELECT
  -- This is a typical dynamic default like NOW() or CURRENT_DATE
  (split_part(substring(adbin, 2), ' ', 1) IN (('SQLVALUEFUNCTION'), ('FUNCEXPR')))
  OR
  -- This is an identity column `GENERATED {ALWAYS | DEFAULT} AS IDENTITY`
  (attidentity <> '')
  OR
  -- Other generated columns show up here.
  (attgenerated <> '')
FROM pg_attribute LEFT JOIN pg_attrdef ON attrelid=adrelid AND attnum=adnum
WHERE attrelid=tab_id AND attnum=col_id;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.is_mathesar_id_column(tab_id oid, col_id integer) RETURNS boolean AS $$/*
Determine whether the given column is our default Mathesar ID column.

The column in question is always attnum 1, and is created with the string

  id integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY

Args:
  tab_id: The OID of the table whose column we'll check
  col_id: The attnum of the column in question
*/
SELECT col_id=1 AND attname='id' AND atttypid='integer'::regtype::oid AND attidentity <> ''
FROM pg_attribute WHERE attrelid=tab_id AND attnum=col_id;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_cast_function_name(target_type regtype) RETURNS text AS $$/*
Return a string giving the appropriate name of the casting function for the target_type.

Currently set up to duplicate the logic in our python casting function builder. This will be
changed. Given a qualified, potentially capitalized type name, we
- Remove the namespace (schema),
- Replace any white space in the type name with underscores,
- Replace double quotes in the type name (e.g., the "char" type) with '_double_quote_'
- Use the prepped type name in the name `mathesar_types.cast_to_%s`.

Args:
  target_type: This should be a type that exists.
*/
DECLARE target_type_prepped text;
BEGIN
  -- TODO: Come up with a way to build these names that is more robust against collisions.
  WITH unqualifier AS (
    SELECT x[array_upper(x, 1)] unqualified_type
    FROM regexp_split_to_array(target_type::text, '\.') x
  ), unspacer AS(
    SELECT replace(unqualified_type, ' ', '_') unspaced_type
    FROM unqualifier
  )
  SELECT replace(unspaced_type, '"', '_double_quote_')
  FROM unspacer
  INTO target_type_prepped;
  RETURN format('mathesar_types.cast_to_%s', target_type_prepped);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_constraint_name(con_id oid) RETURNS text AS $$/*
Return the quoted constraint name of the correponding constraint oid.

Args:
  con_id: The OID of the constraint.
*/
BEGIN
  RETURN quote_ident(conname::text) FROM pg_constraint WHERE pg_constraint.oid = con_id;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_pk_column(rel_id oid) RETURNS smallint AS $$/*
Return the first column attnum in the primary key of a given relation (e.g., table).

Args:
  rel_id: The OID of the relation.
*/
SELECT conkey[1]
FROM pg_constraint
WHERE contype='p'
AND conrelid=rel_id;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_pk_column(sch_name text, rel_name text) RETURNS smallint AS $$/*
Return the first column attnum in the primary key of a given relation (e.g., table).

Args:
  sch_name: The schema of the relation, unquoted.
  rel_name: The name of the relation, unqualified and unquoted.
*/
SELECT conkey[1]
FROM pg_constraint
WHERE contype='p'
AND conrelid=msar.get_relation_oid(sch_name, rel_name);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_column_type(rel_id oid, col_id smallint) RETURNS text AS $$/*
Return the type of a given column in a relation.

Args:
  rel_id: The OID of the relation.
  col_id: The attnum of the column in the relation.
*/
SELECT atttypid::regtype
FROM pg_attribute
WHERE attnum = col_id
AND attrelid = rel_id;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_column_type(sch_name text, rel_name text, col_name text) RETURNS text AS $$/*
Return the type of a given column in a relation.

Args:
  sch_name: The schema of the relation, unquoted.
  rel_name: The name of the relation, unqualified and unquoted.
  col_name: The name of the column in the relation, unquoted.
*/
SELECT atttypid::regtype
FROM pg_attribute
WHERE attname = quote_ident(col_name)
AND attrelid = msar.get_relation_oid(sch_name, rel_name);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_interval_fields(typ_mod integer) RETURNS text AS $$/*
Return the string giving the fields for an interval typmod integer.

This logic is ported from the relevant PostgreSQL source code, reimplemented in SQL. See the
`intervaltypmodout` function at
https://doxygen.postgresql.org/backend_2utils_2adt_2timestamp_8c.html

Args:
  typ_mod: The atttypmod from the pg_attribute table. Should be valid for the interval type.
*/
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


CREATE OR REPLACE FUNCTION
msar.get_type_options(typ_id regtype, typ_mod integer, typ_ndims integer) RETURNS jsonb AS $$/*
Return the type options calculated from a type, typmod pair.

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
        'fields', msar.get_interval_fields(typ_mod)
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


CREATE OR REPLACE FUNCTION msar.get_valid_target_type_strings(typ_id regtype) RETURNS jsonb AS $$/*
Given a source type, return the target types for which Mathesar provides a casting function.

Args:
  typ_id: The type we're casting from.
*/

SELECT jsonb_agg(prorettype::regtype::text)
FROM pg_proc
WHERE
  pronamespace=__msar.get_schema_oid('mathesar_types')
  AND proargtypes[0]=typ_id
  AND left(proname, 5) = 'cast_';
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.has_dependents(rel_id oid, att_id smallint) RETURNS boolean AS $$/*
Return a boolean according to whether the column identified by the given oid, attnum pair is
referenced (i.e., would dropping that column require CASCADE?).

Args:
  rel_id: The relation of the attribute.
  att_id: The attnum of the attribute in the relation.
*/
SELECT EXISTS (
  SELECT 1 FROM pg_depend WHERE refobjid=rel_id AND refobjsubid=att_id AND deptype='n'
);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_column_info(tab_id regclass) RETURNS jsonb AS $$/*
Given a table identifier, return an array of objects describing the columns of the table.

Each returned JSON object in the array will have the form:
  {
    "id": <int>,
    "name": <str>,
    "type": <str>,
    "type_options": <obj>,
    "nullable": <bool>,
    "primary_key": <bool>,
    "default": {"value": <str>, "is_dynamic": <bool>},
    "has_dependents": <bool>,
    "description": <str>
  }

The `type_options` object is described in the docstring of `msar.get_type_options`. The `default`
object has the keys:
  value: A string giving the value (as an SQL expression) of the default.
  is_dynamic: A boolean giving whether the default is (likely to be) dynamic.
*/
SELECT jsonb_agg(
  jsonb_build_object(
    'id', attnum,
    'name', attname,
    'type', CASE WHEN attndims>0 THEN '_array' ELSE atttypid::regtype::text END,
    'type_options', msar.get_type_options(atttypid, atttypmod, attndims),
    'nullable', NOT attnotnull,
    'primary_key', COALESCE(pgi.indisprimary, false),
    'default',
    nullif(
      jsonb_strip_nulls(
        jsonb_build_object(
          'value',
          CASE
            WHEN attidentity='' THEN pg_get_expr(adbin, tab_id)
            ELSE 'identity'
          END,
          'is_dynamic', msar.is_default_possibly_dynamic(tab_id, attnum)
        )
      ),
      jsonb_build_object()
    ),
    'has_dependents', msar.has_dependents(tab_id, attnum),
    'description', msar.col_description(tab_id, attnum)
  )
)
FROM pg_attribute pga
  LEFT JOIN pg_index pgi ON pga.attrelid=pgi.indrelid AND pga.attnum=ANY(pgi.indkey)
  LEFT JOIN pg_attrdef pgd ON pga.attrelid=pgd.adrelid AND pga.attnum=pgd.adnum
WHERE pga.attrelid=tab_id AND pga.attnum > 0 and NOT attisdropped;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.column_exists(tab_id oid, col_name text) RETURNS boolean AS $$/*
Return true if the given column exists in the table, false otherwise.
*/
SELECT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid=tab_id AND attname=col_name);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_table_info(sch_id regnamespace) RETURNS jsonb AS $$/*
Given a schema identifier, return an array of objects describing the tables of the schema.

Each returned JSON object in the array will have the form:
  {
    "oid": <int>,
    "name": <str>,
    "schema": <int>,
    "description": <str>
  }

Args:
  sch_id: The OID or name of the schema.
*/
SELECT jsonb_agg(
  jsonb_build_object(
    'oid', pgc.oid,
    'name', pgc.relname,
    'schema', pgc.relnamespace,
    'description', msar.obj_description(pgc.oid, 'pg_class')
  )
)
FROM pg_catalog.pg_class AS pgc 
  LEFT JOIN pg_catalog.pg_namespace AS pgn ON pgc.relnamespace = pgn.oid
WHERE pgc.relnamespace = sch_id AND pgc.relkind = 'r';
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_schemas() RETURNS jsonb AS $$/*
Return a json array of objects describing the user-defined schemas in the database.

PostgreSQL system schemas are ignored.

Internal Mathesar-specifc schemas are INCLUDED. These should be filtered out by the caller. This
behavior is to avoid tight coupling between this function and other SQL files that might need to
define additional Mathesar-specific schemas as our codebase grows.

Each returned JSON object in the array will have the form:
  {
    "oid": <int>
    "name": <str>
    "description": <str|null>
    "table_count": <int>
  }
*/
SELECT jsonb_agg(schema_data)
FROM (
  SELECT 
    s.oid AS oid,
    s.nspname AS name,
    pg_catalog.obj_description(s.oid) AS description,
    COALESCE(count(c.oid), 0) AS table_count
  FROM pg_catalog.pg_namespace s
  LEFT JOIN pg_catalog.pg_class c ON
    c.relnamespace = s.oid AND
    -- Filter on relkind so that we only count tables. This must be done in the ON clause so that
    -- we still get a row for schemas with no tables.
    c.relkind = 'r'
  WHERE
    s.nspname <> 'information_schema' AND
    s.nspname NOT LIKE 'pg_%'
  GROUP BY
    s.oid,
    s.nspname
) AS schema_data;
$$ LANGUAGE sql;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- ROLE MANIPULATION FUNCTIONS
--
-- Functions in this section should always involve creating, granting, or revoking privileges or
-- roles
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Create mathesar user ----------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION
msar.create_basic_mathesar_user(username text, password_ text) RETURNS TEXT AS $$/*
*/
DECLARE
  sch_name text;
  mathesar_schemas text[] := ARRAY['mathesar_types', '__msar', 'msar'];
BEGIN
  PERFORM __msar.exec_ddl('CREATE USER %I WITH PASSWORD %L', username, password_);
  PERFORM __msar.exec_ddl(
    'GRANT CREATE, CONNECT, TEMP ON DATABASE %I TO %I',
    current_database()::text,
    username
  );
  FOREACH sch_name IN ARRAY mathesar_schemas LOOP
    BEGIN
      PERFORM __msar.exec_ddl('GRANT USAGE ON SCHEMA %I TO %I', sch_name, username);
    EXCEPTION
      WHEN invalid_schema_name THEN
        RAISE NOTICE 'Schema % does not exist', sch_name;
    END;
  END LOOP;
  RETURN username;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- ALTER SCHEMA FUNCTIONS
--
-- Functions in this section should always involve 'ALTER SCHEMA'.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Rename schema -----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.rename_schema(old_sch_name text, new_sch_name text) RETURNS TEXT AS $$/*
Change a schema's name, returning the command executed.

Args:
  old_sch_name: A properly quoted original schema name
  new_sch_name: A properly quoted new schema name
*/
DECLARE
  cmd_template text;
BEGIN
  cmd_template := 'ALTER SCHEMA %s RENAME TO %s';
  RETURN __msar.exec_ddl(cmd_template, old_sch_name, new_sch_name);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.rename_schema(old_sch_name text, new_sch_name text) RETURNS TEXT AS $$/*
Change a schema's name, returning the command executed.

Args:
  old_sch_name: An unquoted original schema name
  new_sch_name: An unquoted new schema name
*/
BEGIN
  RETURN __msar.rename_schema(quote_ident(old_sch_name), quote_ident(new_sch_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.rename_schema(sch_id oid, new_sch_name text) RETURNS TEXT AS $$/*
Change a schema's name, returning the command executed.

Args:
  sch_id: The OID of the original schema
  new_sch_name: An unquoted new schema name
*/
BEGIN
  RETURN __msar.rename_schema(__msar.get_schema_name(sch_id), quote_ident(new_sch_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Comment on schema -------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.comment_on_schema(sch_name text, comment_ text) RETURNS TEXT AS $$/*
Change the description of a schema, returning command executed.

Args:
  sch_name: The quoted name of the schema whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
DECLARE
  cmd_template text;
BEGIN
  cmd_template := 'COMMENT ON SCHEMA %s IS %s';
  RETURN __msar.exec_ddl(cmd_template, sch_name, comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_schema(sch_name text, comment_ text) RETURNS TEXT AS $$/*
Change the description of a schema, returning command executed.

Args:
  sch_name: The quoted name of the schema whose comment we will change.
  comment_: The new comment.
*/
BEGIN
  RETURN __msar.comment_on_schema(quote_ident(sch_name), quote_literal(comment_));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.comment_on_schema(sch_id oid, comment_ text) RETURNS TEXT AS $$/*
Change the description of a schema, returning command executed.

Args:
  sch_id: The OID of the schema.
  comment_: The new comment.
*/
BEGIN
  RETURN __msar.comment_on_schema(__msar.get_schema_name(sch_id), quote_literal(comment_));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- CREATE SCHEMA FUNCTIONS
--
-- Create a schema.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Create schema -----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.create_schema(sch_name text, if_not_exists boolean) RETURNS TEXT AS $$/*
Create a schema, returning the command executed.

Args:
  sch_name: A properly quoted name of the schema to be created
  if_not_exists: Whether to ignore an error if the schema does exist
*/
DECLARE
  cmd_template text;
BEGIN
  IF if_not_exists
  THEN
    cmd_template := 'CREATE SCHEMA IF NOT EXISTS %s';
  ELSE
    cmd_template := 'CREATE SCHEMA %s';
  END IF;
  RETURN __msar.exec_ddl(cmd_template, sch_name);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.create_schema(sch_name text, if_not_exists boolean) RETURNS TEXT AS $$/*
Create a schema, returning the command executed.

Args:
  sch_name: An unquoted name of the schema to be created
  if_not_exists: Whether to ignore an error if the schema does exist
*/
BEGIN
  RETURN __msar.create_schema(quote_ident(sch_name), if_not_exists);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- DROP SCHEMA FUNCTIONS
--
-- Drop a schema.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Drop schema -------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.drop_schema(sch_name text, cascade_ boolean, if_exists boolean) RETURNS TEXT AS $$/*
Drop a schema, returning the command executed.

Args:
  sch_name: A properly quoted name of the schema to be dropped
  cascade_: Whether to drop dependent objects.
  if_exists: Whether to ignore an error if the schema doesn't exist
*/
DECLARE
  cmd_template text;
BEGIN
  IF if_exists
  THEN
    cmd_template := 'DROP SCHEMA IF EXISTS %s';
  ELSE
    cmd_template := 'DROP SCHEMA %s';
  END IF;
  IF cascade_
  THEN
    cmd_template = cmd_template || ' CASCADE';
  END IF;
  RETURN __msar.exec_ddl(cmd_template, sch_name);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_schema(sch_id oid, cascade_ boolean, if_exists boolean) RETURNS TEXT AS $$/*
Drop a schema, returning the command executed.

Args:
  sch_id: The OID of the schema to drop
  cascade_: Whether to drop dependent objects.
  if_exists: Whether to ignore an error if the schema doesn't exist
*/
BEGIN
  RETURN __msar.drop_schema(__msar.get_schema_name(sch_id), cascade_, if_exists);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_schema(sch_name text, cascade_ boolean, if_exists boolean) RETURNS TEXT AS $$/*
Drop a schema, returning the command executed.

Args:
  sch_name: An unqoted name of the schema to be dropped
  cascade_: Whether to drop dependent objects.
  if_exists: Whether to ignore an error if the schema doesn't exist
*/
BEGIN
  RETURN __msar.drop_schema(quote_ident(sch_name), cascade_, if_exists);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- ALTER TABLE FUNCTIONS
--
-- Functions in this section should always involve 'ALTER TABLE'.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Rename table ------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.rename_table(old_tab_name text, new_tab_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  old_tab_name: properly quoted, qualified table name
  new_tab_name: properly quoted, unqualified table name
*/
BEGIN
  RETURN __msar.exec_ddl(
    'ALTER TABLE %s RENAME TO %s', old_tab_name, new_tab_name
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.rename_table(tab_id oid, new_tab_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  tab_id: the OID of the table whose name we want to change
  new_tab_name: unquoted, unqualified table name
*/
BEGIN
  RETURN __msar.rename_table(__msar.get_relation_name(tab_id), quote_ident(new_tab_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.rename_table(sch_name text, old_tab_name text, new_tab_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  sch_name: unquoted schema name where the table lives
  old_tab_name: unquoted, unqualified original table name
  new_tab_name: unquoted, unqualified new table name
*/
DECLARE fullname text;
BEGIN
  fullname := msar.get_fully_qualified_object_name(sch_name, old_tab_name);
  RETURN __msar.rename_table(fullname, quote_ident(new_tab_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Comment on table --------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.comment_on_table(tab_name text, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  tab_name: The qualified, quoted name of the table whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
SELECT __msar.exec_ddl('COMMENT ON TABLE %s IS %s', tab_name, comment_);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_table(tab_id oid, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  tab_id: The OID of the table whose comment we will change.
  comment_: The new comment.
*/
SELECT __msar.comment_on_table(__msar.get_relation_name(tab_id), quote_literal(comment_));
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_table(sch_name text, tab_name text, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  sch_name: The schema of the table whose comment we will change.
  tab_name: The name of the table whose comment we will change.
  comment_: The new comment.
*/
SELECT __msar.comment_on_table(
  msar.get_fully_qualified_object_name(sch_name, tab_name),
  quote_literal(comment_)
);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


-- Alter Table: LEFT IN PYTHON (for now) -----------------------------------------------------------

----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- ALTER TABLE FUNCTIONS: Column operations
--
-- Functions in this section should always involve 'ALTER TABLE', and one or more columns
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

-- Update table primary key sequence to latest -----------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.update_pk_sequence_to_latest(tab_name text, col_name text) RETURNS text AS $$/*
Update the primary key sequence to the maximum of the primary key column, plus one.

Args:
  tab_name: Fully-qualified, quoted table name
  col_name: The column name of the primary key.
*/
BEGIN
  RETURN __msar.exec_ddl(
    'SELECT '
      || 'setval('
      || 'pg_get_serial_sequence(''%1$s'', ''%2$s''), coalesce(max(%2$s) + 1, 1), false'
      || ') '
      || 'FROM %1$s',
    tab_name, col_name
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.update_pk_sequence_to_latest(tab_id oid, col_id integer) RETURNS text AS $$/*
Update the primary key sequence to the maximum of the primary key column, plus one.

Args:
  tab_id: The OID of the table whose primary key sequence we'll update.
  col_id: The attnum of the primary key column.
*/
DECLARE tab_name text;
DECLARE col_name text;
BEGIN
  tab_name :=  __msar.get_relation_name(tab_id);
  col_name := msar.get_column_name(tab_id, col_id);
  RETURN __msar.update_pk_sequence_to_latest(tab_name, col_name);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.update_pk_sequence_to_latest(sch_name text, tab_name text, col_name text) RETURNS text AS $$/*
Update the primary key sequence to the maximum of the primary key column, plus one.

Args:
  sch_name: The schema where the table whose primary key sequence we'll update lives.
  tab_name: The table whose primary key sequence we'll update.
  col_name: The name of the primary key column.
*/
DECLARE qualified_tab_name text;
BEGIN
  qualified_tab_name := msar.get_fully_qualified_object_name(sch_name, tab_name);
  RETURN __msar.update_pk_sequence_to_latest(qualified_tab_name, quote_ident(col_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Drop columns from table -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.drop_columns(tab_name text, col_names variadic text[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  tab_name: Fully-qualified, quoted table name.
  col_names: The column names to be dropped, quoted.
*/
DECLARE column_drops text;
BEGIN
  SELECT string_agg(format('DROP COLUMN %s', col), ', ')
  FROM unnest(col_names) AS col
  INTO column_drops;
  RETURN __msar.exec_ddl('ALTER TABLE %s %s', tab_name, column_drops);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_columns(tab_id oid, col_ids variadic integer[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  tab_id: OID of the table whose columns we'll drop.
  col_ids: The attnums of the columns to drop.
*/
DECLARE col_names text[];
BEGIN
  SELECT array_agg(quote_ident(attname))
  FROM pg_catalog.pg_attribute
  WHERE attrelid=tab_id AND NOT attisdropped AND ARRAY[attnum::integer] <@ col_ids
  INTO col_names;
  PERFORM __msar.drop_columns(msar.get_relation_name_or_null(tab_id), variadic col_names);
  RETURN array_length(col_names, 1);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_columns(sch_name text, tab_name text, col_names variadic text[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  sch_name: The schema where the table whose columns we'll drop lives, unquoted.
  tab_name: The table whose columns we'll drop, unquoted and unqualified.
  col_names: The columns to drop, unquoted.
*/
DECLARE prepared_col_names text[];
DECLARE fully_qualified_tab_name text;
BEGIN
  SELECT array_agg(quote_ident(col)) FROM unnest(col_names) AS col INTO prepared_col_names;
  fully_qualified_tab_name := msar.get_fully_qualified_object_name(sch_name, tab_name);
  RETURN __msar.drop_columns(fully_qualified_tab_name, variadic prepared_col_names);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Column creation definition type -----------------------------------------------------------------

DROP TYPE IF EXISTS __msar.col_def CASCADE;
CREATE TYPE __msar.col_def AS (
  name_ text, -- The name of the column to create, quoted.
  type_ text, -- The type of the column to create, fully specced with arguments.
  not_null boolean, -- A boolean to describe whether the column is nullable or not.
  default_ text, -- Text SQL giving the default value for the column.
  identity_ boolean, -- A boolean giving whether the column is an identity pkey column.
  description text -- A text that will become a comment for the column
);


CREATE OR REPLACE FUNCTION
msar.get_fresh_copy_name(tab_id oid, col_id smallint) RETURNS text AS $$/*
This function generates a name to be used for a duplicated column.

Given an original column name 'abc', the resulting copies will be named 'abc <n>', where <n> is
minimal (at least 1) subject to the restriction that 'abc <n>' is not already a column of the table
given.

Args:
  tab_id: the table for which we'll generate a column name.
  col_id: the original column whose name we'll use as the prefix in our copied column name.
*/
DECLARE
  original_col_name text;
  idx integer := 1;
BEGIN
  original_col_name := attname FROM pg_attribute WHERE attrelid=tab_id AND attnum=col_id;
  WHILE format('%s %s', original_col_name, idx) IN (
    SELECT attname FROM pg_attribute WHERE attrelid=tab_id
  ) LOOP
    idx = idx + 1;
  END LOOP;
  RETURN format('%s %s', original_col_name, idx);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_duplicate_col_defs(
  tab_id oid,
  col_ids smallint[],
  new_names text[],
  copy_defaults boolean
) RETURNS __msar.col_def[] AS $$/*
Get an array of __msar.col_def from given columns in a table.

Args:
  tab_id: The OID of the table containing the column whose definition we want.
  col_ids: The attnums of the columns whose definitions we want.
  new_names: The desired names of the column defs. Must be in same order as col_ids, and same
    length.
  copy_defaults: Whether or not we should copy the defaults
*/
SELECT array_agg(
  (
    -- build a name for the duplicate column
    quote_ident(COALESCE(new_name, msar.get_fresh_copy_name(tab_id, pg_columns.attnum))),
    -- build text specifying the type of the duplicate column
    format_type(atttypid, atttypmod),
    -- set the duplicate column to be nullable, since it will initially be empty
    false,
    -- set the default value for the duplicate column if specified
    CASE WHEN copy_defaults THEN pg_get_expr(adbin, tab_id) END,
    -- We don't set a duplicate column as a primary key, since that would cause an error.
    false,
    msar.col_description(tab_id, pg_columns.attnum)
  )::__msar.col_def
)
FROM pg_attribute AS pg_columns
  JOIN unnest(col_ids, new_names) AS columns_to_copy(col_id, new_name)
    ON pg_columns.attnum=columns_to_copy.col_id
  LEFT JOIN pg_attrdef AS pg_column_defaults
    ON pg_column_defaults.adnum=pg_columns.attnum AND pg_columns.attrelid=pg_column_defaults.adrelid
WHERE pg_columns.attrelid=tab_id;
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.build_unique_column_name_unquoted(tab_id oid, col_name text) RETURNS text AS $$/*
Get a unique column name based on the given name.

Args:
  tab_id: The OID of the table where the column name should be unique.
  col_name: The resulting column name will be equal to or at least based on this.

See the msar.get_fresh_copy_name function for how unique column names are generated.
*/
DECLARE
  col_attnum smallint;
BEGIN
  col_attnum := msar.get_attnum(tab_id, col_name);
  RETURN CASE
    WHEN col_attnum IS NOT NULL THEN msar.get_fresh_copy_name(tab_id, col_attnum) ELSE col_name
  END;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.build_unique_fkey_column_name(tab_id oid, fk_col_name text, frel_name text)
  RETURNS text AS $$/*
Create a unique name for a foreign key column.

Args:
  tab_id: The OID of the table where the column name should be unique.
  fk_col_name: The base name for the foreign key column.
  frel_name: The name of the referent table. Used for creating fk_col_name if not given.

Note that frel_name will be used to build the foreign key column name if it's not given. The result
will be of the form: <frel_name>_id. Then, we apply some logic to ensure the result is unique.
*/
BEGIN
  fk_col_name := COALESCE(fk_col_name, format('%s_id', frel_name));
  RETURN msar.build_unique_column_name_unquoted(tab_id, fk_col_name);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
msar.get_extracted_col_def_jsonb(tab_id oid, col_ids integer[]) RETURNS jsonb AS $$/*
Get a JSON array of column definitions from given columns for creation of an extracted table.

See the msar.process_col_def_jsonb for a description of the JSON.

Args:
  tab_id: The OID of the table containing the columns whose definitions we want.
  col_ids: The attnum of the columns whose definitions we want.
*/

SELECT jsonb_agg(
  jsonb_build_object(
    'name', attname,
    'type', jsonb_build_object('id', atttypid, 'modifier', atttypmod),
    'not_null', attnotnull,
    'default',
    -- We only copy non-dynamic default expressions to new table to avoid double-use of sequences.
    -- Sequences are owned by a specific column, and can't be reused without error.
    CASE WHEN NOT msar.is_default_possibly_dynamic(tab_id, col_id) THEN
      pg_get_expr(adbin, tab_id)
    END
  )
)
FROM pg_attribute AS pg_columns
  JOIN unnest(col_ids) AS columns_to_copy(col_id)
    ON pg_columns.attnum=columns_to_copy.col_id
  LEFT JOIN pg_attrdef AS pg_column_defaults
    ON pg_column_defaults.adnum=pg_columns.attnum AND pg_columns.attrelid=pg_column_defaults.adrelid
WHERE pg_columns.attrelid=tab_id AND NOT msar.is_pkey_col(tab_id, col_id);
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


-- Add columns to table ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.prepare_fields_arg(fields text) RETURNS text AS $$/*
Convert the `fields` argument into an integer for use with the integertypmodin system function.

Args:
  fields: A string corresponding to the documented options from the doumentation at
          https://www.postgresql.org/docs/13/datatype-datetime.html

In order to construct the argument for intervaltypmodin, needed for constructing the typmod value
for INTERVAL types with arguments, we need to apply a transformation to the correct integer. This
transformation is quite arcane, and is lifted straight from the PostgreSQL C code. Given a non-null
fields argument, the steps are:
- Assign each substring of valid `fields` arguments the correct integer (from the Postgres src).
- Apply a bitshift mapping each integer to the according power of 2.
- Sum the results to get an integer signifying the fields argument.
*/
SELECT COALESCE(
  sum(1<<code)::text,
  '32767'  -- 0x7FFF in decimal; This represents no field argument.
)
FROM (
  VALUES
    ('MONTH', 1),
    ('YEAR', 2),
    ('DAY', 3),
    ('HOUR', 10),
    ('MINUTE', 11),
    ('SECOND', 12)
) AS field_map(field, code)
WHERE fields ILIKE '%' || field || '%';
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION __msar.build_typmodin_arg(
  typ_options jsonb, timespan_flag boolean
) RETURNS cstring[] AS $$/*
Build an array to be used as the argument for a typmodin function.

Timespans have to be handled slightly differently since they have a tricky `fields` argument that
requires special processing. See __msar.prepare_fields_arg for more details.

Args:
  typ_options: JSONB giving options fields as per the description in msar.build_type_text.
  timespan_flag: true if the associated type is a timespan, false otherwise.
*/
SELECT array_remove(
  ARRAY[
    typ_options ->> 'length',
    CASE WHEN timespan_flag THEN __msar.prepare_fields_arg(typ_options ->> 'fields') END,
    typ_options ->> 'precision',
    typ_options ->> 'scale'
  ],
  null
)::cstring[]
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.get_formatted_base_type(typ_name text, typ_options jsonb) RETURNS text AS $$ /*
Build the appropriate type definition string, without Array brackets.

This function uses some PostgreSQL internal functions to do its work. In particular, for any type
that takes options, This function uses the typmodin (read "type modification input") system
functions to convert the given options into a typmod integer. The typ_name given is converted into
the OID of the named type. These two pieces let us call `format_type` to get a canonical string
representation of the definition of the type, with its options.

Args:
  typ_name: This should be qualified and quoted as needed.
  typ_options: These should be in the form described in msar.build_type_text.
*/
DECLARE
  typ_id oid;
  timespan_flag boolean;
  typmodin_func text;
  typmod integer;
BEGIN
  -- Here we just get the OID of the type.
  typ_id := typ_name::regtype::oid;
  -- This is a lookup of the function name for the typmodin function associated with the type, if
  -- one exists.
  typmodin_func := typmodin::text FROM pg_type WHERE oid=typ_id AND typmodin<>0;
  -- This flag is needed since timespan types need special handling when converting the options into
  -- the form needed to call the typmodin function.
  timespan_flag := typcategory='T' FROM pg_type WHERE oid=typ_id;
  IF (
    jsonb_typeof(typ_options) = 'null'  -- The caller passed no type options
    OR typ_options IS NULL -- The caller didn't even pass the type options key
    OR typ_options='{}'::jsonb  -- The caller passed an empty type options object
    OR typmodin_func IS NULL  -- The type doesn't actually accept type options
  ) THEN
    typmod := NULL;
  ELSE
    -- Here, we actually run the typmod function to get the output for use in the format_type call.
    EXECUTE format(
      'SELECT %I(%L)',
      typmodin_func,
      __msar.build_typmodin_arg(typ_options, timespan_flag)
    ) INTO typmod;
  END IF;
  RETURN format_type(typ_id::integer, typmod::integer);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
msar.build_type_text(typ_jsonb jsonb) RETURNS text AS $$/*
Turns the given type-describing JSON into a proper string defining a type with arguments

The input JSON should be of the form
  {
    "id": <integer>
    "schema": <str>,
    "name": <str>,
    "modifier": <integer>,
    "options": {
      "length": <integer>,
      "precision": <integer>,
      "scale": <integer>
      "fields": <str>,
      "array": <boolean>
    }
  }

All fields are optional, and a null value as input returns 'text'
*/
SELECT COALESCE(
  -- First choice is the type specified by numeric IDs, since they're most reliable.
  format_type(
    (typ_jsonb ->> 'id')::integer,
    (typ_jsonb ->> 'modifier')::integer
  ),
  -- Second choice is the type specified by string IDs.
  __msar.get_formatted_base_type(
    COALESCE(
      msar.get_fully_qualified_object_name(typ_jsonb ->> 'schema', typ_jsonb ->> 'name'),
      typ_jsonb ->> 'name',
      'text'  -- We fall back to 'text' when input is null or empty.
    ),
    typ_jsonb -> 'options'
  ) || CASE
    WHEN (typ_jsonb -> 'options' ->> 'array')::boolean THEN
      '[]'
    ELSE ''
  END
)
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
msar.build_type_text_complete(typ_jsonb jsonb, old_type text) RETURNS text AS $$/*
Build the text name of a type, using the old type as a base if only options are given.

The main use for this is to allow for altering only the options of the type of a column.

Args:
  typ_jsonb: This is a jsonb denoting the new type.
  old_type: This is the old type name, with no options.

The typ_jsonb should be in the form:
{
  "name": <str> (optional),
  "options": <obj> (optional)
}

*/
SELECT msar.build_type_text(
  jsonb_strip_nulls(
    jsonb_build_object(
      'name', COALESCE(typ_jsonb ->> 'name', old_type),
      'options', typ_jsonb -> 'options'
    )
  )
);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;



CREATE OR REPLACE FUNCTION __msar.build_col_def_text(col __msar.col_def) RETURNS text AS $$/*
Build appropriate text defining the given column for table creation or alteration.
*/
SELECT format(
  '%s %s %s %s %s',
  col.name_,
  col.type_,
  CASE WHEN col.not_null THEN 'NOT NULL' END,
  'DEFAULT ' || col.default_,
  -- This can be used to define our default Mathesar primary key column.
  -- TODO: We should really consider doing GENERATED *ALWAYS* (rather than BY DEFAULT), but this
  -- breaks some other assumptions.
  CASE WHEN col.identity_ THEN 'GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY' END
);
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
msar.process_col_def_jsonb(
  tab_id oid,
  col_defs jsonb,
  raw_default boolean,
  create_id boolean DEFAULT false
) RETURNS __msar.col_def[] AS $$/*
Create an __msar.col_def from a JSON array of column creation defining JSON blobs.

Args:
  tab_id: The OID of the table where we'll create the columns
  col_defs: A jsonb array defining a column creation (must have "type" key; "name",
                  "not_null", and "default" keys optional).
  raw_default: This boolean tells us whether we chould reproduce the default with or without quoting
               and escaping. True means we don't quote or escape, but just use the raw value.
  create_id: This boolean defines whether or not we should automatically add a default Mathesar 'id'
             column to the input.

The col_defs should have the form:
[
  {
    "name": <str> (optional),
    "type": {
      "name": <str> (optional),
      "options": <obj> (optional),
    },
    "not_null": <bool> (optional; default false),
    "default": <any> (optional),
    "description": <str> (optional)
  },
  {
    ...
  }
]

For more info on the type.options object, see the msar.build_type_text function. All pieces are
optional. If an empty object {} is given, the resulting column will have a default name like
'Column <n>' and type TEXT. It will allow nulls and have a null default value.
*/
WITH attnum_cte AS (
  SELECT MAX(attnum) AS m_attnum FROM pg_attribute WHERE attrelid=tab_id
), col_create_cte AS (
  SELECT (
    -- build a name for the column
    COALESCE(
      quote_ident(col_def_obj ->> 'name'),
      quote_ident('Column ' || (attnum_cte.m_attnum + ROW_NUMBER() OVER ())),
      quote_ident('Column ' || (ROW_NUMBER() OVER ()))
    ),
    -- build the column type
    msar.build_type_text(col_def_obj -> 'type'),
    -- set the not_null value for the column
    col_def_obj ->> 'not_null',
    -- set the default value for the column
    CASE
      WHEN col_def_obj ->> 'default' IS NULL THEN
        NULL
      WHEN raw_default THEN
        col_def_obj ->> 'default'
      ELSE
        format('%L', col_def_obj ->> 'default')
    END,
    -- We don't allow setting the primary key column manually
    false,
    -- Set the description for the column
    quote_literal(col_def_obj ->> 'description')
  )::__msar.col_def AS col_defs
  FROM attnum_cte, jsonb_array_elements(col_defs) AS col_def_obj
  WHERE col_def_obj ->> 'name' IS NULL OR col_def_obj ->> 'name' <> 'id'
)
SELECT array_cat(
  CASE
    WHEN create_id THEN
      -- The below tuple defines a default 'id' column for Mathesar.  It has name id, type integer,
      -- it's not null, it uses the 'identity' functionality to generate default values, has
      -- a default comment.
      ARRAY[('id', 'integer', true, null, true, 'Mathesar default ID column')]::__msar.col_def[]
  END,
  array_agg(col_defs)
)
FROM col_create_cte;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
__msar.add_columns(tab_name text, col_defs variadic __msar.col_def[]) RETURNS text AS $$/*
Add the given columns to the given table.

Args:
  tab_name: Fully-qualified, quoted table name.
  col_defs: The columns to be added.
*/
WITH ca_cte AS (
  SELECT string_agg(
    'ADD COLUMN ' || __msar.build_col_def_text(col),
      ', '
    ) AS col_additions
  FROM unnest(col_defs) AS col
)
SELECT __msar.exec_ddl('ALTER TABLE %s %s', tab_name, col_additions) FROM ca_cte;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.add_columns(tab_id oid, col_defs jsonb, raw_default boolean DEFAULT false)
  RETURNS smallint[] AS $$/*
Add columns to a table.

Args:
  tab_id: The OID of the table to which we'll add columns.
  col_defs: a JSONB array defining columns to add. See msar.process_col_def_jsonb for details.
  raw_default: Whether to treat defaults as raw SQL. DANGER!
*/
DECLARE
  col_create_defs __msar.col_def[];
  fq_table_name text := __msar.get_relation_name(tab_id);
BEGIN
  col_create_defs := msar.process_col_def_jsonb(tab_id, col_defs, raw_default);
  PERFORM __msar.add_columns(fq_table_name, variadic col_create_defs);

  PERFORM
  __msar.comment_on_column(
      fq_table_name,
      col_create_def.name_,
      col_create_def.description
    )
  FROM unnest(col_create_defs) AS col_create_def
  WHERE col_create_def.description IS NOT NULL;

  RETURN array_agg(attnum)
    FROM (SELECT * FROM pg_attribute WHERE attrelid=tab_id) L
    INNER JOIN unnest(col_create_defs) R
    ON quote_ident(L.attname) = R.name_;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.add_columns(sch_name text, tab_name text, col_defs jsonb, raw_default boolean)
  RETURNS smallint[] AS $$/*
Add columns to a table.

Args:
  sch_name: unquoted schema name of the table to which we'll add columns.
  tab_name: unquoted, unqualified name of the table to which we'll add columns.
  col_defs: a JSONB array defining columns to add. See msar.process_col_def_jsonb for details.
  raw_default: Whether to treat defaults as raw SQL. DANGER!
*/
SELECT msar.add_columns(msar.get_relation_oid(sch_name, tab_name), col_defs, raw_default);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR ADD CONSTRAINTS FUNCTIONS
--
-- Add constraints to tables and (for NOT NULL) columns.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Constraint creation definition type -------------------------------------------------------------

DROP TYPE IF EXISTS __msar.con_def CASCADE;
CREATE TYPE __msar.con_def AS (
/*
This should be used in the context of a single ALTER TABLE command. So, no need to reference the
constrained table's OID.
*/
  name_ text, -- The name of the constraint to create, qualified and quoted.
  type_ "char", -- The type of constraint to create, as a "char". See pg_constraint.contype
  col_names text[], -- The columns for the constraint, quoted.
  deferrable_ boolean, -- Whether or not the constraint is deferrable.
  fk_rel_name text, -- The foreign table for an fkey, qualified and quoted.
  fk_col_names text[], -- The foreign table's columns for an fkey, quoted.
  fk_upd_action "char", -- Action taken when fk referent is updated. See pg_constraint.confupdtype.
  fk_del_action "char", -- Action taken when fk referent is deleted. See pg_constraint.confdeltype.
  fk_match_type "char", -- The match type of the fk constraint. See pg_constraint.confmatchtype.
  expression text -- Text SQL giving the expression for the constraint (if applicable).
);


CREATE OR REPLACE FUNCTION msar.get_fkey_action_from_char("char") RETURNS text AS $$/*
Map the "char" from pg_constraint to the update or delete action string.
*/
SELECT CASE
  WHEN $1 = 'a' THEN 'NO ACTION'
  WHEN $1 = 'r' THEN 'RESTRICT'
  WHEN $1 = 'c' THEN 'CASCADE'
  WHEN $1 = 'n' THEN 'SET NULL'
  WHEN $1 = 'd' THEN 'SET DEFAULT'
END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION msar.get_fkey_match_type_from_char("char") RETURNS text AS $$/*
Convert a char to its proper string describing the match type.

NOTE: Since 'PARTIAL' is not implemented (and throws an error), we don't use it here.
*/
SELECT CASE
  WHEN $1 = 'f' THEN 'FULL'
  WHEN $1 = 's' THEN 'SIMPLE'
END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION __msar.build_con_def_text(con __msar.con_def) RETURNS text AS $$/*
Build appropriate text defining the given constraint for table creation or alteration.

If the given con.name_ is null, the syntax changes slightly (we don't add 'CONSTRAINT'). The FOREIGN
KEY constraint has a number of extra strings that may or may not be appended.  The best
documentation for this is the FOREIGN KEY section of the CREATE TABLE docs:
https://www.postgresql.org/docs/current/sql-createtable.html

One helpful note is that this function makes use heavy of the || operator. This operator returns
null if either side is null, and thus

  'CONSTRAINT ' || con.name_ || ' '

is 'CONSTRAINT <name> ' when con.name_ is not null, and simply null if con.name_ is null.
*/
SELECT CASE
    WHEN con.type_ = 'u' THEN  -- It's a UNIQUE constraint
      format(
        '%sUNIQUE %s',
        'CONSTRAINT ' || con.name_ || ' ',
        __msar.build_text_tuple(con.col_names)
      )
    WHEN con.type_ = 'p' THEN  -- It's a PRIMARY KEY constraint
      format(
        '%sPRIMARY KEY %s',
        'CONSTRAINT ' || con.name_ || ' ',
        __msar.build_text_tuple(con.col_names)
      )
    WHEN con.type_ = 'f' THEN  -- It's a FOREIGN KEY constraint
      format(
        '%sFOREIGN KEY %s REFERENCES %s%s%s%s%s',
        'CONSTRAINT ' || con.name_ || ' ',
        __msar.build_text_tuple(con.col_names),
        con.fk_rel_name,
        __msar.build_text_tuple(con.fk_col_names),
        ' MATCH ' || msar.get_fkey_match_type_from_char(con.fk_match_type),
        ' ON DELETE ' || msar.get_fkey_action_from_char(con.fk_del_action),
        ' ON UPDATE ' || msar.get_fkey_action_from_char(con.fk_upd_action)
      )
    ELSE
      NULL
  END
  || CASE WHEN con.deferrable_ THEN 'DEFERRABLE' ELSE '' END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.process_con_def_jsonb(tab_id oid, con_create_arr jsonb)
  RETURNS __msar.con_def[] AS $$/*
Create an array of  __msar.con_def from a JSON array of constraint creation defining JSON.

Args:
  tab_id: The OID of the table where we'll create the constraints.
  con_create_arr: A jsonb array defining a constraint creation (must have "type" key; "name",
                  "not_null", and "default" keys optional).


The con_create_arr should have the form:
[
  {
    "name": <str> (optional),
    "type": <str>,
    "columns": [<int:str>, <int:str>, ...],
    "deferrable": <bool> (optional),
    "fkey_relation_id": <int> (optional),
    "fkey_relation_schema": <str> (optional),
    "fkey_relation_name": <str> (optional),
    "fkey_columns": [<int:str>, <int:str>, ...] (optional),
    "fkey_update_action": <str> (optional),
    "fkey_delete_action": <str> (optional),
    "fkey_match_type": <str> (optional),
  },
  {
    ...
  }
]
If the constraint type is "f", then we require
- fkey_relation_id or (fkey_relation_schema and fkey_relation_name).

Numeric IDs are preferred over textual ones where both are accepted.
*/
SELECT array_agg(
  (
    -- build the name for the constraint, properly quoted.
    quote_ident(con_create_obj ->> 'name'),
    -- set the constraint type as a single char. See __msar.build_con_def_text for details.
    con_create_obj ->> 'type',
    -- Set the column names associated with the constraint.
    msar.get_column_names(tab_id, con_create_obj -> 'columns'),
    -- Set whether the constraint is deferrable or not (boolean).
    con_create_obj ->> 'deferrable',
    -- Build the relation name where the constraint will be applied. Prefer numeric ID.
    COALESCE(
      __msar.get_relation_name((con_create_obj -> 'fkey_relation_id')::integer::oid),
      msar.get_fully_qualified_object_name(
        con_create_obj ->> 'fkey_relation_schema', con_create_obj ->> 'fkey_relation_name'
      )
    ),
    -- Build the array of foreign columns for an fkey constraint.
    msar.get_column_names(
      COALESCE(
        -- We validate that the given OID (if any) is correct.
        (con_create_obj -> 'fkey_relation_id')::integer::oid,
        -- If given a schema, name pair, we get the OID from that (and validate it).
        msar.get_relation_oid(
          con_create_obj ->> 'fkey_relation_schema', con_create_obj ->> 'fkey_relation_name'
        )
      ),
      con_create_obj -> 'fkey_columns'
    ),
    -- The below are passed directly. They define some parameters for FOREIGN KEY constraints.
    con_create_obj ->> 'fkey_update_action',
    con_create_obj ->> 'fkey_delete_action',
    con_create_obj ->> 'fkey_match_type',
    null -- not yet implemented
  )::__msar.con_def
) FROM jsonb_array_elements(con_create_arr) AS x(con_create_obj);
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
__msar.add_constraints(tab_name text, con_defs variadic __msar.con_def[])
  RETURNS TEXT AS $$/*
Add the given constraints to the given table.

Args:
  tab_name: Fully-qualified, quoted table name.
  con_defs: The constraints to be added.
*/
WITH con_cte AS (
  SELECT string_agg('ADD ' || __msar.build_con_def_text(con), ', ') as con_additions
  FROM unnest(con_defs) as con
)
SELECT __msar.exec_ddl('ALTER TABLE %s %s', tab_name, con_additions) FROM con_cte;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.add_constraints(tab_id oid, con_defs jsonb) RETURNS oid[] AS $$/*
Add constraints to a table.

Args:
  tab_id: The OID of the table to which we'll add constraints.
  col_defs: a JSONB array defining constraints to add. See msar.process_con_def_jsonb for details.
*/
DECLARE
  con_create_defs __msar.con_def[];
BEGIN
  con_create_defs := msar.process_con_def_jsonb(tab_id, con_defs);
  PERFORM __msar.add_constraints(__msar.get_relation_name(tab_id), variadic con_create_defs);
  RETURN array_agg(oid) FROM pg_constraint WHERE conrelid=tab_id;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.add_constraints(sch_name text, tab_name text, con_defs jsonb)
  RETURNS oid[] AS $$/*
Add constraints to a table.

Args:
  sch_name: unquoted schema name of the table to which we'll add constraints.
  tab_name: unquoted, unqualified name of the table to which we'll add constraints.
  con_defs: a JSONB array defining constraints to add. See msar.process_con_def_jsonb for details.
*/
SELECT msar.add_constraints(msar.get_relation_oid(sch_name, tab_name), con_defs);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


DROP TYPE IF EXISTS __msar.not_null_def CASCADE;
CREATE TYPE __msar.not_null_def AS (
  col_name text, -- The column to be modified, quoted.
  not_null boolean -- The value to set for null or not null.
);


CREATE OR REPLACE FUNCTION
__msar.set_not_nulls(tab_name text, not_null_defs __msar.not_null_def[]) RETURNS TEXT AS $$/*
Set or drop not null constraints on columns
*/
WITH not_null_cte AS (
  SELECT string_agg(
    CASE
      WHEN not_null_def.not_null=true THEN format('ALTER %s SET NOT NULL', not_null_def.col_name)
      WHEN not_null_def.not_null=false THEN format ('ALTER %s DROP NOT NULL', not_null_def.col_name)
    END,
    ', '
  ) AS not_nulls
  FROM unnest(not_null_defs) as not_null_def
)
SELECT __msar.exec_ddl('ALTER TABLE %s %s', tab_name, not_nulls) FROM not_null_cte;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.copy_constraint(con_id oid, from_col_id smallint, to_col_id smallint)
  RETURNS oid[] AS $$/*
Copy a single constraint associated with a column.

Given a column with attnum 3 involved in the original constraint, and a column with attnum 4 to be
involved in the constraint copy, and other columns 1 and 2 involved in the constraint, suppose the
original constraint had conkey [1, 2, 3]. The copy constraint should then have conkey [1, 2, 4].

For now, this is only implemented for unique constraints.

Args:
  con_id: The oid of the constraint we'll copy.
  from_col_id: The column ID to be removed from the original's conkey in the copy.
  to_col_id: The column ID to be added to the original's conkey in the copy.
*/
WITH
  con_cte AS (SELECT * FROM pg_constraint WHERE oid=con_id AND contype='u'),
  con_def_cte AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', null,
        'type', con_cte.contype,
        'columns', array_replace(con_cte.conkey, from_col_id, to_col_id)
      )
    ) AS con_def FROM con_cte
  )
SELECT msar.add_constraints(con_cte.conrelid, con_def_cte.con_def) FROM con_cte, con_def_cte;
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.copy_column(
  tab_id oid, col_id smallint, copy_name text, copy_data boolean, copy_constraints boolean
) RETURNS smallint AS $$/*
Copy a column of a table
*/
DECLARE
  col_defs __msar.col_def[];
  tab_name text;
  col_name text;
  created_col_id smallint;
BEGIN
  col_defs := msar.get_duplicate_col_defs(
    tab_id, ARRAY[col_id], ARRAY[copy_name], copy_data
  );
  tab_name := __msar.get_relation_name(tab_id);
  col_name := msar.get_column_name(tab_id, col_id);
  PERFORM __msar.add_columns(tab_name, VARIADIC col_defs);
  created_col_id := attnum
    FROM pg_attribute
    WHERE attrelid=tab_id AND quote_ident(attname)=col_defs[1].name_;
  IF copy_data THEN
    PERFORM __msar.exec_ddl(
      'UPDATE %s SET %s=%s',
      tab_name, col_defs[1].name_, msar.get_column_name(tab_id, col_id)
    );
  END IF;
  IF copy_constraints THEN
    PERFORM msar.copy_constraint(oid, col_id, created_col_id)
    FROM pg_constraint
    WHERE conrelid=tab_id AND ARRAY[col_id] <@ conkey;
    PERFORM __msar.set_not_nulls(
      tab_name, ARRAY[(col_defs[1].name_, attnotnull)::__msar.not_null_def]
    )
    FROM pg_attribute WHERE attrelid=tab_id AND attnum=col_id;
  END IF;
  RETURN created_col_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
msar.get_extracted_con_def_jsonb(tab_id oid, col_ids integer[]) RETURNS jsonb AS $$/*
Get a JSON array of constraint definitions from given columns for creation of an extracted table.

See the msar.process_con_def_jsonb for a description of the JSON.

Args:
  tab_id: The OID of the table containing the constraints whose definitions we want.
  col_ids: The attnum of columns with the constraints whose definitions we want.
*/

SELECT jsonb_agg(
  jsonb_build_object(
    'type', contype,
    'columns', ARRAY[attname],
    'deferrable', condeferrable,
    'fkey_relation_id', confrelid::integer,
    'fkey_columns', confkey,
    'fkey_update_action', confupdtype,
    'fkey_delete_action', confdeltype,
    'fkey_match_type', confmatchtype
  )
)
FROM pg_constraint
  JOIN unnest(col_ids) AS columns_to_copy(col_id) ON pg_constraint.conkey[1]=columns_to_copy.col_id
  JOIN pg_attribute
    ON pg_attribute.attnum=columns_to_copy.col_id AND pg_attribute.attrelid=pg_constraint.conrelid
WHERE pg_constraint.conrelid=tab_id AND (pg_constraint.contype='f' OR pg_constraint.contype='u');
$$ LANGUAGE sql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR DROP TABLE FUNCTIONS
--
-- Drop a table.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

-- Drop table --------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.drop_table(tab_name text, cascade_ boolean, if_exists boolean) RETURNS text AS $$/*
Drop a table, returning the command executed.

Args:
  tab_name: The qualified, quoted name of the table we will drop.
  cascade_: Whether to add CASCADE.
  if_exists_: Whether to ignore an error if the table doesn't exist
*/
DECLARE
  cmd_template TEXT;
BEGIN
  IF if_exists
  THEN
    cmd_template := 'DROP TABLE IF EXISTS %s';
  ELSE
    cmd_template := 'DROP TABLE %s';
  END IF;
  IF cascade_
  THEN
    cmd_template = cmd_template || ' CASCADE';
  END IF;
  RETURN __msar.exec_ddl(cmd_template, tab_name);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_table(tab_id oid, cascade_ boolean) RETURNS text AS $$/*
Drop a table, returning the fully qualified name of the dropped table.

Args:
  tab_id: The OID of the table to drop
  cascade_: Whether to drop dependent objects.
*/
DECLARE relation_name text;
BEGIN
  relation_name := msar.get_relation_name_or_null(tab_id);
  -- if_exists doesn't work while working with oids because
  -- the SQL query gets parameterized with tab_id instead of relation_name
  -- since we're unable to find the relation_name for a non existing table. 
  PERFORM __msar.drop_table(relation_name, cascade_, if_exists => false);
  RETURN relation_name;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_table(sch_name text, tab_name text, cascade_ boolean, if_exists boolean)
  RETURNS text AS $$/*
Drop a table, returning the command executed.

Args:
  sch_name: The schema of the table to drop.
  tab_name: The name of the table to drop.
  cascade_: Whether to drop dependent objects.
  if_exists_: Whether to ignore an error if the table doesn't exist
*/
DECLARE qualified_tab_name text;
BEGIN
  qualified_tab_name := msar.get_fully_qualified_object_name(sch_name, tab_name);
  RETURN __msar.drop_table(qualified_tab_name, cascade_, if_exists);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR DROP CONSTRAINT FUNCTIONS
--
-- Drop a constraint.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

-- Drop constraint ---------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION
__msar.drop_constraint(tab_name text, con_name text) RETURNS text AS $$/*
Drop a constraint, returning the command executed.

Args:
  tab_name: A qualified & quoted name of the table that has the constraint to be dropped.
  con_name: Name of the constraint to drop, properly quoted.
*/
BEGIN
  RETURN __msar.exec_ddl(
    'ALTER TABLE %s DROP CONSTRAINT %s', tab_name, con_name
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_constraint(sch_name text, tab_name text, con_name text) RETURNS text AS $$/*
Drop a constraint, returning the command executed.

Args:
  sch_name: The name of the schema where the table with constraint to be dropped resides, unquoted.
  tab_name: The name of the table that has the constraint to be dropped, unquoted.
  con_name: Name of the constraint to drop, unquoted.
*/
BEGIN
  RETURN __msar.drop_constraint(
    msar.get_fully_qualified_object_name(sch_name, tab_name), quote_ident(con_name)
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_constraint(tab_id oid, con_id oid) RETURNS TEXT AS $$/*
Drop a constraint, returning the command executed.

Args:
  tab_id: OID of the table that has the constraint to be dropped.
  con_id: OID of the constraint to be dropped.
*/
BEGIN
  RETURN __msar.drop_constraint(
    __msar.get_relation_name(tab_id), msar.get_constraint_name(con_id)
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Create Mathesar table function

CREATE OR REPLACE FUNCTION
__msar.add_table(tab_name text, col_defs __msar.col_def[], con_defs __msar.con_def[])
  RETURNS text AS $$/*
Add a table, returning the command executed.

Args:
  tab_name: A qualified & quoted name for the table to be added.
  col_defs: An array of __msar.col_def defining the column set of the new table.
  con_defs (optional): An array of __msar.con_def defining the constraints for the new table.

Note: Even if con_defs is null, there can be some column-level constraints set in col_defs.
*/
WITH col_cte AS (
  SELECT string_agg(__msar.build_col_def_text(col), ', ') AS table_columns
  FROM unnest(col_defs) AS col
), con_cte AS (
  SELECT string_agg(__msar.build_con_def_text(con), ', ') AS table_constraints
  FROM unnest(con_defs) as con
)
SELECT __msar.exec_ddl(
  'CREATE TABLE %s (%s)',
  tab_name,
  concat_ws(', ', table_columns, table_constraints)
)
FROM col_cte, con_cte;
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
msar.add_mathesar_table(sch_oid oid, tab_name text, col_defs jsonb, con_defs jsonb, comment_ text)
  RETURNS oid AS $$/*
Add a table, with a default id column, returning the OID of the created table.

Args:
  sch_oid: The OID of the schema where the table will be created.
  tab_name: The unquoted name for the new table.
  col_defs (optional): The columns for the new table, in order.
  con_defs (optional): The constraints for the new table.
  comment_ (optional): The comment for the new table.

Note that even if col_defs is null, we will still create a table with a default 'id' column. Also,
if an 'id' column is given in the input, it will be replaced with our default 'id' column. This is
the behavior of the current python functions, so we're keeping it for now. In any case, the created
table will always have our default 'id' column as its first column.
*/
DECLARE
  fq_table_name text;
  created_table_id oid;
  column_defs __msar.col_def[];
  constraint_defs __msar.con_def[];
BEGIN
  fq_table_name := format('%s.%s', __msar.get_schema_name(sch_oid), quote_ident(tab_name));
  column_defs := msar.process_col_def_jsonb(0, col_defs, false, true);
  constraint_defs := msar.process_con_def_jsonb(0, con_defs);
  PERFORM __msar.add_table(fq_table_name, column_defs, constraint_defs);
  created_table_id := fq_table_name::regclass::oid;
  PERFORM msar.comment_on_table(created_table_id, comment_);
  RETURN created_table_id;
END;
$$ LANGUAGE plpgsql;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- COLUMN ALTERATION FUNCTIONS
--
-- Functions in this section should be related to altering columns' names, types, and constraints.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


-- Rename columns ----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.rename_column(tab_name text, old_col_name text, new_col_name text) RETURNS text AS $$/*
Change a column name, returning the command executed

Args:
  tab_name: The qualified, quoted name of the table where we'll change a column name
  old_col_name: The quoted name of the column to change.
  new_col_name: The quoted new name for the column.
*/
DECLARE
  cmd_template text;
BEGIN
  cmd_template := 'ALTER TABLE %s RENAME COLUMN %s TO %s';
  IF old_col_name <> new_col_name THEN
    RETURN __msar.exec_ddl(cmd_template, tab_name, old_col_name, new_col_name);
  ELSE
    RETURN null;
  END IF;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.rename_column(tab_id oid, col_id integer, new_col_name text) RETURNS smallint AS $$/*
Change a column name, returning the command executed

Args:
  tab_id: The OID of the table whose column we're renaming
  col_id: The ID of the column to rename
  new_col_name: The unquoted new name for the column.
*/
BEGIN
  PERFORM __msar.rename_column(
    tab_name => __msar.get_relation_name(tab_id),
    old_col_name => msar.get_column_name(tab_id, col_id),
    new_col_name => quote_ident(new_col_name)
  );
  RETURN col_id;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION __msar.build_cast_expr(val text, type_ text) RETURNS text AS $$/*
Build an expression for casting a column in Mathesar, returning the text of that expression.

We fall back silently to default casting behavior if the mathesar_types namespace is missing.
However, we do throw an error in cases where the schema exists, but the type casting function
doesn't. This is assumed to be an error the user should know about.

Args:
  val: This is quite general, and isn't sanitized in any way. It can be either a literal or a column
       identifier, since we want to be able to produce a casting expression in either case.
  type_: This type name string must cast properly to a regtype.
*/
SELECT CASE
  WHEN msar.schema_exists('mathesar_types') THEN
    msar.get_cast_function_name(type_::regtype) || '(' || val || ')'
  ELSE
    val || '::' || type_::regtype::text
END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.build_col_drop_default_expr(tab_id oid, col_id integer, new_type text, new_default jsonb)
  RETURNS TEXT AS $$/*
Build an expression for dropping a column's default, returning the text of that expression.

This function is private, and not general: It builds an expression in the context of the
msar.process_col_alter_jsonb function and should not otherwise be called independently, since it has
logic specific to that context. In that setting, we drop the default for the specified column if the
caller specifies that we're setting a new_default of NULL, or if we're changing the type of the
column.

Args:
  tab_id: The OID of the table where the column with the default to be dropped lives.
  col_id: The attnum of the column with the undesired default.
  new_type: This gives the function context letting it know whether to drop the default or not. If
            we are setting a new type for the column, we will always drop the default first.
  new_default: This also gives us context letting us know whether to drop the default. By setting
               the 'new_default' to (jsonb) null, the caller specifies that we should drop the
               column's default.
*/
SELECT CASE WHEN new_type IS NOT NULL OR jsonb_typeof(new_default)='null' THEN
  'ALTER COLUMN ' || msar.get_column_name(tab_id, col_id) || ' DROP DEFAULT'
 END;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION
__msar.build_col_retype_expr(tab_id oid, col_id integer, new_type text) RETURNS text AS $$/*
Build an expression to change a column's type, returning the text of that expression.

Note that this function wraps the type alteration in a cast expression. If we have the custom
mathesar_types cast functions available, we prefer those to the default PostgreSQL casting behavior.

Args:
  tab_id: The OID of the table containing the column whose type we'll alter.
  col_id: The attnum of the column whose type we'll alter.
  new_type: The target type to which we'll alter the column.
*/
SELECT 'ALTER COLUMN '
  || msar.get_column_name(tab_id, col_id)
  || ' TYPE '
  || new_type
  || ' USING '
  || __msar.build_cast_expr(msar.get_column_name(tab_id, col_id), new_type);
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION __msar.build_col_default_expr(
  tab_id oid,
  col_id integer,
  old_default text,
  new_default jsonb,
  new_type text
) RETURNS text AS $$/*
Build an expression to set a column's default value, returning the text of that expression.

This function is private, and not general. The expression it builds is in the context of the calling
msar.process_col_alter_jsonb function. In particular, this function can also reset the original
default after a column type alteration, but cast to the new type of the column. We also avoid
setting a new default in cases where the new default argument is (sql) NULL, or a JSONB null.

Args:
  tab_id: The OID of the table containing the column whose default we'll alter.
  col_id: The attnum of the column whose default we'll alter.
  old_default: The current default. In some cases in the context of the caller, we want to reset the
               original default, but cast to a new type.
  new_default: The new desired default. It's left as JSONB since we are using JSONB 'null' values to
               represent 'drop the column default'.
  new_type: The target type to which we'll cast the new default.
*/
DECLARE
  default_expr text;
  raw_default_expr text;
BEGIN
  -- In this case, we assume the intent is to clear out the original default.
  IF jsonb_typeof(new_default)='null' THEN
    default_expr := null;
  -- We get the root JSONB value as text if it exists.
  ELSEIF new_default #>> '{}' IS NOT NULL THEN
    default_expr := format('%L', new_default #>> '{}');  -- sanitize since this could be user input.
  -- At this point, we know we're not setting a new default, or dropping the old one.
  -- So, we check whether the original default is potentially dynamic, and whether we need to cast
  -- it to a new type.
  ELSEIF msar.is_default_possibly_dynamic(tab_id, col_id) AND new_type IS NOT NULL THEN
    -- We add casting the possibly dynamic expression to the new type as part of the default
    -- expression in this case.
    default_expr := __msar.build_cast_expr(old_default, new_type);
  ELSEIF old_default IS NOT NULL AND new_type IS NOT NULL THEN
    -- If we arrive here, then we know the old_default is a constant value, and we want to cast the
    -- old default value to the new type *before* setting it as the new default. This avoids
    -- building up nested cast functions in the default expression.
    -- The first step is to execute the cast expression, putting the result into a new variable.
    EXECUTE format('SELECT %s', __msar.build_cast_expr(old_default, new_type))
      INTO raw_default_expr;
    -- Then we format that new variable's value as a literal.
    default_expr := format('%L', raw_default_expr);
  END IF;
  RETURN
    format('ALTER COLUMN %s SET DEFAULT ', msar.get_column_name(tab_id, col_id)) || default_expr;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
__msar.build_col_not_null_expr(tab_id oid, col_id integer, not_null boolean) RETURNS text AS $$/*
Build an expression to alter a column's NOT NULL setting, returning the text of that expression.

Args:
  tab_id: The OID of the table containing the column whose nullability we'll alter.
  col_id: The attnum of the column whose nullability we'll alter.
  not_null: If true, we 'SET NOT NULL'. If false, we 'DROP NOT NULL' if null, we do nothing.
*/
SELECT 'ALTER COLUMN '
  || msar.get_column_name(tab_id, col_id)
  || CASE WHEN not_null THEN ' SET ' ELSE ' DROP ' END
  || 'NOT NULL';
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.build_col_drop_text(tab_id oid, col_id integer, col_delete boolean) RETURNS text AS $$/*
Build an expression to drop a column from a table, returning the text of that expression.

Args:
  tab_id: The OID of the table containing the column whose nullability we'll alter.
  col_id: The attnum of the column whose nullability we'll alter.
  col_delete: If true, we drop the column. If false or null, we do nothing.
*/
SELECT CASE WHEN col_delete THEN 'DROP COLUMN ' || msar.get_column_name(tab_id, col_id) END;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.process_col_alter_jsonb(tab_id oid, col_alters jsonb) RETURNS text AS $$/*
Turn a JSONB array representing a set of desired column alterations into a text expression.

Args:
  tab_id The OID of the table whose columns we'll alter.
  col_alters: a JSONB array defining the list of column alterations.

The col_alters JSONB should have the form:
[
  {
    "attnum": <int>,
    "type": <obj> (optional),
    "default": <any> (optional),
    "not_null": <bool> (optional),
    "delete": <bool> (optional),
    "name": <str> (optional),
  },
  {
    ...
  },
  ...
]

Notes on the col_alters JSONB
- For more info about the type object, see the msar.build_type_text function.
- The "name" key isn't used in this function; it's included here for completeness.
- A possible 'gotcha' is the "default" key.
  - If omitted, no change to the default for the given column will occur, other than to cast it to
    the new type if a type change is specified.
  - If, on the other hand, the "default" key is set to an explicit value of null, then we will
    interpret that as a directive to set the column's default to NULL, i.e., we'll drop the current
    default setting.
- If the column is a default mathesar ID column, we will silently skip it so it won't be altered.
*/
WITH prepped_alters AS (
  SELECT
    tab_id,
    (col_alter_obj ->> 'attnum')::integer AS col_id,
    msar.build_type_text_complete(col_alter_obj -> 'type', format_type(atttypid, null)) AS new_type,
    -- We get the old default expression from a catalog table before modifying anything, so we can
    -- reset it properly if we alter the column type.
    pg_get_expr(adbin, tab_id) old_default,
    col_alter_obj -> 'default' AS new_default,
    (col_alter_obj -> 'not_null')::boolean AS not_null,
    (col_alter_obj -> 'delete')::boolean AS delete_
  FROM
    (SELECT tab_id) as arg,
    jsonb_array_elements(col_alters) as t(col_alter_obj)
    INNER JOIN pg_attribute ON (t.col_alter_obj ->> 'attnum')::smallint=attnum AND tab_id=attrelid
    LEFT JOIN pg_attrdef ON (t.col_alter_obj ->> 'attnum')::smallint=adnum AND tab_id=adrelid
  WHERE NOT msar.is_mathesar_id_column(tab_id, (t.col_alter_obj ->> 'attnum')::integer)
)
SELECT string_agg(
  nullif(
    concat_ws(
      ', ',
      __msar.build_col_drop_default_expr(tab_id, col_id, new_type, new_default),
      __msar.build_col_retype_expr(tab_id, col_id, new_type),
      __msar.build_col_default_expr(tab_id, col_id, old_default, new_default, new_type),
      __msar.build_col_not_null_expr(tab_id, col_id, not_null),
      __msar.build_col_drop_text(tab_id, col_id, delete_)
    ),
    ''
  ),
  ', '
)
FROM prepped_alters;
$$ LANGUAGE SQL RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.alter_columns(tab_id oid, col_alters jsonb) RETURNS integer[] AS $$/*
Alter columns of the given table in bulk, returning the IDs of the columns so altered.

Args:
  tab_id: The OID of the table whose columns we'll alter.
  col_alters: a JSONB describing the alterations to make.

For the specification of the col_alters JSONB, see the msar.process_col_alter_jsonb function.

Note that all alterations except renaming are done in bulk, and then all name changes are done one
at a time afterwards. This is because the SQL design specifies at most one name-changing clause per
query.
*/
DECLARE
  r RECORD;
  col_alter_str TEXT;
  description_alter RECORD;
BEGIN
  -- Get the string specifying all non-name-change alterations to perform.
  col_alter_str := msar.process_col_alter_jsonb(tab_id, col_alters);

  -- Perform the non-name-change alterations
  IF col_alter_str IS NOT NULL THEN
    PERFORM __msar.exec_ddl(
      'ALTER TABLE %s %s',
      __msar.get_relation_name(tab_id),
      msar.process_col_alter_jsonb(tab_id, col_alters)
    );
  END IF;

  -- Here, we perform all description-changing alterations.
  FOR description_alter IN 
    SELECT
      (col_alter->>'attnum')::integer AS col_id,
      col_alter->>'description' AS comment_
    FROM jsonb_array_elements(col_alters) AS col_alter
    WHERE __msar.jsonb_key_exists(col_alter, 'description')
  LOOP
    PERFORM msar.comment_on_column(
      tab_id := tab_id,
      col_id := description_alter.col_id,
      comment_ := description_alter.comment_
    );
  END LOOP;

  -- Here, we perform all name-changing alterations.
  FOR r in SELECT attnum, name FROM jsonb_to_recordset(col_alters) AS x(attnum integer, name text)
  LOOP
    PERFORM msar.rename_column(tab_id, r.attnum, r.name);
  END LOOP;
  RETURN array_agg(x.attnum) FROM jsonb_to_recordset(col_alters) AS x(attnum integer);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Comment on column -------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION
__msar.comment_on_column(
  tab_name text,
  col_name text,
  comment_ text
) RETURNS text AS $$/*
Change the description of a column, returning command executed. If comment_ is NULL, column's
comment is removed.

Args:
  tab_name: The name of the table containg the column whose comment we will change.
  col_name: The name of the column whose comment we'll change
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
DECLARE
  comment_or_null text := COALESCE(comment_, 'NULL');
BEGIN
RETURN __msar.exec_ddl(
  'COMMENT ON COLUMN %s.%s IS %s',
  tab_name,
  col_name,
  comment_or_null
);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION
msar.comment_on_column(
  sch_name text,
  tab_name text,
  col_name text,
  comment_ text
) RETURNS text AS $$/*
Change the description of a column, returning command executed.

Args:
  sch_name: The schema of the table whose column's comment we will change.
  tab_name: The name of the table whose column's comment we will change.
  col_name: The name of the column whose comment we will change.
  comment_: The new comment.
*/
SELECT __msar.comment_on_column(
  msar.get_fully_qualified_object_name(sch_name, tab_name),
  quote_ident(col_name),
  quote_literal(comment_)
);
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
__msar.comment_on_column(
  tab_id oid,
  col_id integer,
  comment_ text
) RETURNS text AS $$/*
Change the description of a column, returning command executed.

Args:
  tab_id: The OID of the table containg the column whose comment we will change.
  col_id: The ATTNUM of the column whose comment we will change.
  comment_: The new comment.
*/
SELECT __msar.comment_on_column(
  __msar.get_relation_name(tab_id),
  msar.get_column_name(tab_id, col_id),
  comment_
);
$$ LANGUAGE SQL;


CREATE OR REPLACE FUNCTION
msar.comment_on_column(
  tab_id oid,
  col_id integer,
  comment_ text
) RETURNS text AS $$/*
Change the description of a column, returning command executed.

Args:
  tab_id: The OID of the table containg the column whose comment we will change.
  col_id: The ATTNUM of the column whose comment we will change.
  comment_: The new comment.
*/
SELECT __msar.comment_on_column(
  tab_id,
  col_id,
  quote_literal(comment_)
);
$$ LANGUAGE SQL;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR LINK FUNCTIONS
--
-- Add a link to the table.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

-- Create a Many-to-One or a One-to-One link -------------------------------------------------------


CREATE OR REPLACE FUNCTION
msar.create_many_to_one_link(
  frel_id oid,
  rel_id oid,
  col_name text,
  unique_link boolean DEFAULT false
) RETURNS smallint AS $$/* 
Create a many-to-one or a one-to-one link between tables, returning the attnum of the newly created
column, returning the attnum of the added column.

Args:
  frel_id: The OID of the referent table, named for confrelid in the pg_attribute table.
  rel_id: The OID of the referrer table, named for conrelid in the pg_attribute table.
  col_name: Name of the new column to be created in the referrer table, unquoted.
  unique_link: Whether to make the link one-to-one instead of many-to-one.
*/
DECLARE
  pk_col_id smallint;
  col_defs jsonb;
  added_col_ids smallint[];
  con_defs jsonb;
BEGIN
  pk_col_id := msar.get_pk_column(frel_id);
  col_defs := jsonb_build_array(
    jsonb_build_object(
      'name', col_name,
      'type', jsonb_build_object('name', msar.get_column_type(frel_id, pk_col_id))
    )
  );
  added_col_ids := msar.add_columns(rel_id , col_defs , false);
  con_defs := jsonb_build_array(
    jsonb_build_object(
      'name', null,
      'type', 'f',
      'columns', added_col_ids,
      'deferrable', false,
      'fkey_relation_id', frel_id::integer,
      'fkey_columns', jsonb_build_array(pk_col_id)
    )
  );
  IF unique_link THEN
    con_defs := jsonb_build_array(
      jsonb_build_object(
        'name', null,
        'type', 'u',
        'columns', added_col_ids)
    ) || con_defs;
  END IF;
  PERFORM msar.add_constraints(rel_id , con_defs);
  RETURN added_col_ids[1];
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

-- Create a Many-to-Many link ----------------------------------------------------------------------


CREATE OR REPLACE FUNCTION
msar.create_many_to_many_link(
  sch_id oid,
  tab_name text,
  from_rel_ids oid[],
  col_names text[]
) RETURNS oid AS $$/* 
Create a many-to-many link between tables, returning the oid of the newly created table.

Args:
  sch_id: The OID of the schema in which new referrer table is to be created.
  tab_name: Name of the referrer table to be created.
  from_rel_ids: The OIDs of the referent tables.
  col_names: Names of the new column to be created in the referrer table, unqoted.
*/
DECLARE
  added_table_id oid;
BEGIN
  added_table_id := msar.add_mathesar_table(sch_id, tab_name , NULL, NULL, NULL);
  PERFORM msar.create_many_to_one_link(a.rel_id, added_table_id, b.col_name)
  FROM unnest(from_rel_ids) WITH ORDINALITY AS a(rel_id, idx)
  JOIN unnest(col_names) WITH ORDINALITY AS b(col_name, idx) USING (idx);
  RETURN added_table_id;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- TABLE SPLITTING FUNCTIONS
--
-- Functions to extract columns from a table
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION
msar.extract_columns_from_table(
  tab_id oid, col_ids integer[], new_tab_name text, fk_col_name text
) RETURNS jsonb AS $f$/*
Extract columns from a table to create a new table, linked by a foreign key.

Args:
  tab_id: The OID of the table whose columns we'll extract
  col_ids: An array of the attnums of the columns to extract
  new_tab_name: The name of the new table to be made from the extracted columns, unquoted
  fk_col_name: The name to give the new foreign key column in the remainder table (optional)

The extraction takes a set of columns from the table, and creates a new table from the set of
*distinct* tuples those columns comprise. We also add a new foreign key column to the original
 (remainder) table that links it to the new extracted table so they can be easily rejoined. The
 extracted columns are removed from the remainder table.
*/
DECLARE
  extracted_col_defs CONSTANT jsonb := msar.get_extracted_col_def_jsonb(tab_id, col_ids);
  extracted_con_defs CONSTANT jsonb := msar.get_extracted_con_def_jsonb(tab_id, col_ids);
  fkey_name CONSTANT text := msar.build_unique_fkey_column_name(tab_id, fk_col_name, new_tab_name);
  extracted_table_id integer;
  fkey_attnum integer;
BEGIN
  -- Begin by creating a new table with column definitions matching the extracted columns.
  extracted_table_id := msar.add_mathesar_table(
    msar.get_relation_namespace_oid(tab_id),
    new_tab_name,
    extracted_col_defs,
    extracted_con_defs,
    format('Extracted from %s', __msar.get_relation_name(tab_id))
  );
  -- Create a new fkey column and foreign key linking the original table to the extracted one.
  fkey_attnum := msar.create_many_to_one_link(extracted_table_id, tab_id, fkey_name);
  -- Insert the data from the original table's columns into the extracted columns, and add
  -- appropriate fkey values to the new fkey column in the original table to give the proper
  -- mapping.
  PERFORM __msar.exec_ddl($t$
    WITH fkey_cte AS (
      SELECT id, %1$s, dense_rank() OVER (ORDER BY %1$s) AS __msar_tmp_id
      FROM %2$s
    ), ins_cte AS (
      INSERT INTO %3$s (%1$s)
      SELECT DISTINCT %1$s FROM fkey_cte ORDER BY %1$s
    )
    UPDATE %2$s SET %4$I=__msar_tmp_id FROM fkey_cte WHERE
    %2$s.id=fkey_cte.id
    $t$,
    -- %1$s  This is a comma separated string of the extracted column names
    string_agg(quote_ident(col_def ->> 'name'), ', '),
    -- %2$s  This is the name of the original (remainder) table
    __msar.get_relation_name(tab_id),
    -- %3$s  This is the new extracted table name
    __msar.get_relation_name(extracted_table_id),
    -- %4$I  This is the name of the fkey column in the remainder table.
    fkey_name
  ) FROM jsonb_array_elements(extracted_col_defs) AS col_def;
  -- Drop the original versions of the extracted columns from the original table.
  PERFORM msar.drop_columns(tab_id, variadic col_ids);
  -- In case the user wanted to give a name to the fkey column matching one of the extracted
  -- columns, perform that operation now (since the original will now be dropped from the original
  -- table)
  IF fk_col_name IS NOT NULL AND fk_col_name IN (
    SELECT col_def ->> 'name'
    FROM jsonb_array_elements(extracted_col_defs) AS col_def
  ) THEN
    PERFORM msar.rename_column(tab_id, fkey_attnum, fk_col_name);
  END IF;
  RETURN jsonb_build_array(extracted_table_id, fkey_attnum);
END;
$f$ LANGUAGE plpgsql;
