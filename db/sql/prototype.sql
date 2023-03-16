/*
Functions for testing feasibility of moving different Mathesar pieces to the database. These are
part of the 'remove SQLAlchemy' project.

There are three involved schemas:
      __msar:  These functions aren't designed to be used except by other Mathesar functions.
               Generally need preformatted strings as input, won't do quoting, etc.
        msar:  These functions are designed to be used more easily. They'll format strings, quote
               identifiers, and so on.
  msar_views:  This schema is where internal mathesar views will be stored.

The reason they're so abbreviated is to avoid namespace clashes, and also because making them longer
would make using them quite tedious, since they're everywhere.
*/

CREATE SCHEMA IF NOT EXISTS __msar;
CREATE SCHEMA IF NOT EXISTS msar;
CREATE SCHEMA IF NOT EXISTS msar_views;

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
Return the name for a given table, qualified or quoted as appropriate.

In cases where the table is already included in the search path, the returned name will not be
fully-qualified.

Args:
  table_id:   The OID of the table.
*/
BEGIN
  RETURN attname::text FROM pg_attribute WHERE attrelid=table_id AND attnum=col_attnum;
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.get_mathesar_view_name(table_id oid) RETURNS text AS $$/*
Given a table OID, return the name of the special Mathesar view tracking it.

Args:
  table_id: The OID of the table whose associated view we want to name.
*/
BEGIN
  RETURN msar.get_fq_table_name('msar_views', format('mv%s', table_id));
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
__msar.change_table_name(old_name text, new_name text) RETURNS text AS $$/*
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
msar.change_table_name(table_id oid, new_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  table_id:  the OID of the table whose name we want to change
  new_name:  unquoted, unqualified table name
*/
BEGIN
  RETURN __msar.change_table_name(__msar.get_table_name(table_id), quote_ident(new_name));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.change_table_name(schema_ text, old_name text, new_name text) RETURNS text AS $$/*
Change a table's name, returning the command executed.

Args:
  schem: unquoted schema name where the table lives
  old_name:  unquoted, unqualified original table name
  new_name:  unquoted, unqualified new table name
*/
DECLARE fullname text;
BEGIN
  fullname := msar.get_fq_table_name(schema_, old_name);
  RETURN __msar.change_table_name(fullname, quote_ident(new_name));
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


----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR VIEW FUNCTIONS
--
-- Functions and triggers in this section are used to create a view that tracks any created or
-- modified table, and also provide a convenient way to set up such a view for an already-existing
-- table or drop such a view.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION
msar.create_mathesar_view(table_id oid) RETURNS text AS $$/*
Create a view of named mv<table_id> tracking the table with OID <table_id>.

Args:
  table_id: This is the OID of the table we want to track.

*/
DECLARE viewname text;
DECLARE viewcols text;
BEGIN
  viewname := msar.get_msar_view_name(table_id);
  SELECT string_agg(format('%s AS c%s', quote_ident(attname), attnum), ', ')
    FROM pg_attribute
    WHERE attrelid=table_id AND attnum>0 AND NOT attisdropped
  INTO viewcols;
  RETURN __msar.exec_ddl(
    'CREATE OR REPLACE VIEW %s AS SELECT %s FROM %s',
    viewname, viewcols, __msar.get_table_name(table_id)
  );
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION
__msar.create_mathesar_view() RETURNS event_trigger AS $$/*
This function should not be called directly.
*/
DECLARE ddl_command record;
BEGIN
  FOR ddl_command IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
      IF ddl_command.object_type='table' AND upper(ddl_command.command_tag)<>'DROP TABLE'
      THEN
        PERFORM msar.create_mathesar_view(ddl_command.objid);
      END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS create_mathesar_view;

CREATE EVENT TRIGGER create_mathesar_view ON ddl_command_end
  EXECUTE FUNCTION __msar.create_mathesar_view();


CREATE OR REPLACE FUNCTION
msar.drop_mathesar_view(table_id oid) RETURNS text AS $$/*
Drop the Mathesar view tracking the given table.

Args:
  table_id: This is the OID of the table being tracked by the view we'll drop.
*/
DECLARE viewname text;
BEGIN
  viewname := msar.get_mathesar_view_name(table_id);
  RETURN __msar.exec_ddl('DROP VIEW IF EXISTS %s', viewname);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;


CREATE OR REPLACE FUNCTION
msar.drop_mathesar_view(schema_ text, table_name text) RETURNS text AS $$/*
Drop the Mathesar view tracking the given table.

Args:
  schema_: This is the schema of the table being tracked by the view we'll drop.
  table_name: This is the name of the table being tracked by the view we'll drop.
*/
DECLARE table_id oid;
BEGIN
  table_id := msar.get_table_oid(schema_, table_name);
  RETURN msar.drop_mathesar_view(table_id);
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
