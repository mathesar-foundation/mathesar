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

schema   -> sch
table   ->  tab
column   -> col
object   -> obj
relation -> rel

Textual names will have the suffix _name, and numeric identifiers will have the suffix _id.

So, the OID of a table will be tbl_id and the name of a column will be col_name. The attnum of a
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


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- INFO FUNCTIONS
--
-- Functions in this section get information about a given table or column.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
msar.get_fully_qualified_object_name(sch_name text, obj_name text) RETURNS text AS $$/*
Return the fully-qualified, properly quoted, name for a given database object (e.g., table).

Args:
  sch_name: The schema of the object, unquoted.
  obj_name: The name of the object, unqualified and unquoted.
*/
BEGIN
  RETURN format('%s.%s', quote_ident(sch_name), quote_ident(obj_name));
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
msar.get_relation_oid(sch_name text, rel_name text) RETURNS text AS $$/*
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


CREATE OR REPLACE FUNCTION
msar.get_column_name(rel_id oid, col_id integer) RETURNS text AS $$/*
Return the name for a given column in a given relation (e.g., table).

More precisely, this function returns the name of attributes of any relation appearing in the
pg_class catalog table (so you could find attributes of indices with this function).

Args:
  rel_id:  The OID of the relation.
  col_id:  The attnum of the column in the relation.
*/
BEGIN
  RETURN quote_ident(attname::text) FROM pg_attribute WHERE attrelid=rel_id AND attnum=col_id;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.is_pkey_col(rel_id oid, col_id integer) RETURNS boolean AS $$/*
Return whether the given column is in the primary key of the given relation (e.g., table).

Args:
  rel_id:  The OID of the relation.
  col_id:  The attnum of the column in the relation.
*/
BEGIN
  RETURN ARRAY[col_attnum::smallint] <@ conkey FROM pg_constraint WHERE conrelid=rel_id;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


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
BEGIN
  RETURN __msar.exec_ddl('COMMENT ON TABLE %s IS ''%s''', tab_name, comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_table(tab_id oid, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  tab_id: The OID of the table whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
BEGIN
  RETURN __msar.comment_on_table(__msar.get_relation_name(tab_id), comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_table(sch_name text, tab_name text, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  sch_name: The schema of the table whose comment we will change.
  tab_name: The name of the table whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
DECLARE qualified_tab_name text;
BEGIN
  qualified_tab_name := msar.get_fully_qualified_object_name(sch_name, tab_name);
  RETURN __msar.comment_on_table(qualified_tab_name, comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


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
  FROM pg_attribute
  WHERE attrelid=tab_id AND ARRAY[attnum::integer] <@ col_ids
  INTO col_names;
  RETURN __msar.drop_columns(__msar.get_relation_name(tab_id), variadic col_names);
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


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR DROP TABLE FUNCTIONS
--
-- Drop a table.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

-- Drop table --------------------------------------------------------------------------------

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
msar.drop_table(tab_id oid, cascade_ boolean, if_exists boolean) RETURNS text AS $$/*
Drop a table, returning the command executed.

Args:
  tab_id: The OID of the table to drop
  cascade_: Whether to drop dependent objects.
  if_exists_: Whether to ignore an error if the table doesn't exist
*/
BEGIN
  RETURN __msar.drop_table(__msar.get_relation_name(tab_id), cascade_, if_exists);
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
