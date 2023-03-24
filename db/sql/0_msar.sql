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
msar.get_fq_table_name(schema_ text, name_ text) RETURNS text AS $$/*
Return the fully-qualified, properly quoted, name for a given table.

Args:
  schema_: The schema of the table, unquoted.
  name_:   The name of the table, unqualified and unquoted.
*/
BEGIN
  RETURN format('%s.%s', quote_ident(schema_), quote_ident(name_));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
__msar.get_table_name(table_id oid) RETURNS text AS $$/*
Return the name for a given table, qualified or quoted as appropriate.

In cases where the table is already included in the search path, the returned name will not be
fully-qualified.

Args:
  table_id:   The OID of the table.
*/
BEGIN
  RETURN table_id::regclass::text;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_table_oid(schema_ text, name_ text) RETURNS text AS $$/*
Return the OID for a given table.

Args:
  schema_: The schema of the table, unquoted.
  name_:   The name of the table, unqualified and unquoted.
*/
BEGIN
  RETURN msar.get_fq_table_name(schema_, name_)::regclass::oid;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_column_name(table_id oid, col_attnum integer) RETURNS text AS $$/*
Return the name for a given column in a given table.

Args:
  table_id:  The OID of the table.
  column_attnum:   The attnum of the column in the table.
*/
BEGIN
  RETURN quote_ident(attname::text) FROM pg_attribute WHERE attrelid=table_id AND attnum=col_attnum;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.is_pkey_col(table_id oid, col_attnum integer) RETURNS boolean AS $$/*
Return whether the given column is in the primary key of the given table.
*/
BEGIN
  RETURN ARRAY[col_attnum::smallint] <@ conkey FROM pg_constraint WHERE conrelid=table_id;
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
__msar.rename_table(old_name text, new_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  old_name:  properly quoted, qualified table name
  new_name:  properly quoted, unqualified table name
*/
BEGIN
  RETURN __msar.exec_ddl(
    'ALTER TABLE %s RENAME TO %s', old_name, new_name
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.rename_table(table_id oid, new_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  table_id:  the OID of the table whose name we want to change
  new_name:  unquoted, unqualified table name
*/
BEGIN
  RETURN __msar.rename_table(__msar.get_table_name(table_id), quote_ident(new_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.rename_table(schema_ text, old_name text, new_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  schema_: unquoted schema name where the table lives
  old_name:  unquoted, unqualified original table name
  new_name:  unquoted, unqualified new table name
*/
DECLARE fullname text;
BEGIN
  fullname := msar.get_fq_table_name(schema_, old_name);
  RETURN __msar.rename_table(fullname, quote_ident(new_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Comment on table --------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.comment_on_table(name_ text, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  name_: The qualified, quoted name of the table whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
BEGIN
  RETURN __msar.exec_ddl('COMMENT ON TABLE %s IS ''%s''', name_, comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_table(table_id oid, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  table_id: The OID of the table whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
BEGIN
  RETURN __msar.comment_on_table(__msar.get_table_name(table_id), comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.comment_on_table(schema_ text, name_ text, comment_ text) RETURNS text AS $$/*
Change the description of a table, returning command executed.

Args:
  schema_: The schema of the table whose comment we will change.
  name_: The name of the table whose comment we will change.
  comment_: The new comment. Any quotes or special characters must be escaped.
*/
DECLARE qualified_name text;
BEGIN
  qualified_name := msar.get_fq_table_name(schema_, name_);
  RETURN __msar.comment_on_table(qualified_name, comment_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Alter Table: LEFT IN PYTHON (for now) -----------------------------------------------------------

-- Update table primary key sequence to latest -----------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.update_pk_sequence_to_latest(table_name text, column_ text) RETURNS text AS $$/*
Update the primary key sequence to the maximum of the primary key column, plus one.

Args:
  table_name: fully-qualified, quoted table name
  column_: The column name of the primary key.
*/
BEGIN
  RETURN __msar.exec_ddl(
    'SELECT '
      || 'setval('
      || 'pg_get_serial_sequence(''%1$s'', ''%2$s''), coalesce(max(%2$s) + 1, 1), false'
      || ') '
      || 'FROM %1$s',
    table_name, column_
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.update_pk_sequence_to_latest(table_id oid, col_attnum integer) RETURNS text AS $$/*
Update the primary key sequence to the maximum of the primary key column, plus one.

Args:
  table_id: The OID of the table whose primary key sequence we'll update.
  col_attnum: The attnum of the primary key column.
*/
DECLARE table_name text;
DECLARE colname text;
BEGIN
  table_name :=  __msar.get_table_name(table_id);
  colname := msar.get_column_name(table_id, col_attnum);
  RETURN __msar.update_pk_sequence_to_latest(qualified_table_name, colname);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.update_pk_sequence_to_latest(schema_ text, table_name text, column_ text) RETURNS text AS $$/*
Update the primary key sequence to the maximum of the primary key column, plus one.

Args:
  table_id: The OID of the table whose primary key sequence we'll update.
  col_attnum: The attnum of the primary key column.
*/
DECLARE qualified_table_name text;
BEGIN
  qualified_table_name := msar.get_fq_table_name(schema_, table_name);
  RETURN __msar.update_pk_sequence_to_latest(qualified_table_name, quote_ident(column_));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


-- Drop columns from table -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
__msar.drop_columns(table_name text, columns variadic text[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  table_name: fully-qualified, quoted table name.
  columns: The column names to be dropped, quoted.
*/
DECLARE column_drops text;
BEGIN
  SELECT string_agg(format('DROP COLUMN %s', col), ', ')
  FROM unnest(columns) AS col
  INTO column_drops;
  RETURN __msar.exec_ddl('ALTER TABLE %s %s', table_name, column_drops);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_columns(table_id oid, attnums variadic integer[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  table_id: OID of the table whose columns we'll drop.
  attnums: The attnums of the columns to drop.
*/
DECLARE columns text[];
BEGIN
  SELECT array_agg(quote_ident(attname))
  FROM pg_attribute
  WHERE attrelid=table_id AND ARRAY[attnum::integer] <@ attnums
  INTO columns;
  RETURN __msar.drop_columns(__msar.get_table_name(table_id), variadic columns);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_columns(table_id oid, attnums variadic integer[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  table_id: OID of the table whose columns we'll drop.
  attnums: The attnums of the columns to drop.
*/
DECLARE columns text[];
BEGIN
  SELECT array_agg(quote_ident(attname))
  FROM pg_attribute
  WHERE attrelid=table_id AND ARRAY[attnum::integer] <@ attnums
  INTO columns;
  RETURN __msar.drop_columns(__msar.get_table_name(table_id), variadic columns);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_columns(schema_ text, table_ text, columns variadic text[]) RETURNS text AS $$/*
Drop the given columns from the given table.

Args:
  table_id: OID of the table whose columns we'll drop.
  attnums: The attnums of the columns to drop.
*/
DECLARE prepared_columns text[];
BEGIN
  SELECT array_agg(quote_ident(col)) FROM unnest(columns) AS col INTO prepared_columns;
  RETURN __msar.drop_columns(msar.get_fq_table_name(schema_, table_), variadic prepared_columns);
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
__msar.drop_table(name_ text, cascade_ boolean, if_exists boolean) RETURNS text AS $$/*
Drop a table, returning the command executed.

Args:
  name_: The qualified, quoted name of the table we will drop.
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
  RETURN __msar.exec_ddl(cmd_template, name_);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_table(table_id oid, cascade_ boolean, if_exists boolean) RETURNS text AS $$/*
Drop a table, returning the command executed.

Args:
  table_id: The OID of the table to drop
  cascade_: Whether to drop dependent objects.
  if_exists_: Whether to ignore an error if the table doesn't exist
*/
BEGIN
  RETURN __msar.drop_table(__msar.get_table_name(table_id), cascade_, if_exists);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_table(schema_ text, name_ text, cascade_ boolean, if_exists boolean) RETURNS text AS $$/*
Drop a table, returning the command executed.

Args:
  schema_: The schema of the table to drop.
  name_: The name of the table to drop.
  cascade_: Whether to drop dependent objects.
  if_exists_: Whether to ignore an error if the table doesn't exist
*/
DECLARE qualified_name text;
BEGIN
  qualified_name := msar.get_fq_table_name(schema_, name_);
  RETURN __msar.drop_table(qualified_name, cascade_, if_exists);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
