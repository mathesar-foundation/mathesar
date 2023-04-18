----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
-- MATHESAR VIEW FUNCTIONS
--
-- This file depends on `msar.sql` !
--
-- A Mathesar view is essentially a reflection of a user table, but with names changed for easy look
-- ups.
--  * The view name is derived algorithmically from the user table's OID using
--    `msar.get_mathesar_view_name`, giving the name `mv12345`, where 12345 is the table OID.
--  * The view's columns' names are derived algorithmically from the attnums of the columns in the
--    view, with a column having attnum 3 getting the name `c3`.
--
-- Functions and triggers in this file are used to create a Mathesar view whenever a table is
-- created or in any way altered in the database (where the triggers are installed). They also
-- provide a convenient way to set up such a view for an already-existing table or drop
-- such a view.
--
-- This file creates a schema `msar_views` where internal mathesar views will be stored.
----------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS msar_views;


CREATE OR REPLACE FUNCTION
msar.get_mathesar_view_name(table_id oid) RETURNS text AS $$/*
Given a table OID, return the name of the special Mathesar view tracking it.

Args:
  table_id: The OID of the table whose associated view we want to name.
*/
BEGIN
  RETURN msar.get_fully_qualified_object_name('msar_views', format('mv%s', table_id));
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;



CREATE OR REPLACE FUNCTION
msar.create_mathesar_view(table_id oid) RETURNS text AS $$/*
Create a view of named mv<table_id> tracking the table with OID <table_id>.

Args:
  table_id: This is the OID of the table we want to track.

*/
DECLARE viewname text;
DECLARE viewcols text;
BEGIN
  viewname := msar.get_mathesar_view_name(table_id);
  SELECT string_agg(format('%s AS c%s', quote_ident(attname), attnum), ', ')
    FROM pg_attribute
    WHERE attrelid=table_id AND attnum>0 AND NOT attisdropped
  INTO viewcols;
  RETURN __msar.exec_ddl(
    'CREATE OR REPLACE VIEW %s AS SELECT %s FROM %s',
    viewname, viewcols, __msar.get_relation_name(table_id)
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
  table_id := msar.get_relation_oid(schema_, table_name);
  RETURN msar.drop_mathesar_view(table_id);
EXCEPTION WHEN undefined_table THEN
  RETURN 'NO SUCH TABLE';
END;
$$ LANGUAGE plpgsql RETURNS NULL ON NULL INPUT;
