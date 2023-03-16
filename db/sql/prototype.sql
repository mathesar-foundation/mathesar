-- Functions for testing feasibility of moving different Mathesar pieces to the
-- database. These are part of the 'remove SQLAlchemy' project.


-- Initial setup. This defines a general DDL execution function, as well as our
-- internal schema for holding all this functionality, 'mathesar_internal'.

CREATE SCHEMA IF NOT EXISTS mathesar_internal;

CREATE OR REPLACE FUNCTION mathesar_internal.execute_ddl(text) RETURNS TEXT
  AS $$
    BEGIN
      EXECUTE $1;
      RETURN $1;
    END;
$$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION mathesar_internal.execute_ddl(text, variadic anyarray) RETURNS TEXT
  AS $$
    DECLARE
      cmd TEXT;
    BEGIN
      cmd := format($1, VARIADIC $2);
      EXECUTE cmd;
      RETURN cmd;
    END;
$$
LANGUAGE plpgsql VOLATILE;


-- db.tables.operations.alter

-- Rename table

CREATE OR REPLACE FUNCTION mathesar_internal.change_table_name_internal(text, text) RETURNS TEXT
  AS $$
    BEGIN
      RETURN mathesar_internal.execute_ddl('ALTER TABLE %s RENAME TO %s', $1, $2);
    END;
$$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION mathesar_internal.change_table_name(oid, text) RETURNS TEXT
  AS $$
    BEGIN
      RETURN mathesar_internal.change_table_name_internal($1::regclass::text, $2);
    END;
$$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION mathesar_internal.change_table_name(text, text, text) RETURNS TEXT
  AS $$
    DECLARE qualified_name TEXT;
    BEGIN
      qualified_name := format('%s.%s', quote_ident($1), quote_ident($2));
      RETURN mathesar_internal.change_table_name_internal(qualified_name, quote_ident($3));
    END;
$$
LANGUAGE plpgsql VOLATILE;

-- Comment on Table

CREATE OR REPLACE FUNCTION mathesar_internal.comment_on_table_internal(text, text) RETURNS TEXT
  AS $$
    BEGIN
      RETURN mathesar_internal.execute_ddl('COMMENT ON TABLE %s IS ''%s''', $1, $2);
    END;
$$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION mathesar_internal.comment_on_table(oid, text) RETURNS TEXT
  AS $$
    BEGIN
      RETURN mathesar_internal.comment_on_table_internal($1::regclass::text, $2);
    END;
$$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION mathesar_internal.comment_on_table(text, text, text) RETURNS TEXT
  AS $$
    DECLARE qualified_name TEXT;
    BEGIN
      qualified_name := format('%s.%s', quote_ident($1), quote_ident($2));
      RETURN mathesar_internal.comment_on_table_internal(qualified_name, quote_ident($3));
    END;
$$
LANGUAGE plpgsql VOLATILE;


-- Alter Table: LEFT IN PYTHON (for now)


-- Update pk sequence to latest

CREATE OR REPLACE FUNCTION mathesar_internal.update_pk_sequence_to_latest_internal(text, text) RETURNS TEXT
  AS $$
    BEGIN
      RETURN mathesar_internal.execute_ddl(
        'SELECT setval(pg_get_serial_sequence(''%1$s'', ''%2$s''), coalesce(max(%2$s) + 1, 1), false) FROM %1$s',
        $1, $2
      );
    END;
$$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION mathesar_internal.update_pk_sequence_to_latest(oid, integer) RETURNS TEXT
  AS $$
    DECLARE qualified_table_name TEXT;
    DECLARE colname TEXT;
    BEGIN
      SELECT $1::regclass::text INTO qualified_table_name;
      SELECT attname::text FROM pg_attribute WHERE attrelid=$1 AND attnum=$2 INTO colname;
      RETURN mathesar_internal.update_pk_sequence_to_latest_internal(qualified_table_name, colname);
    END;
$$
LANGUAGE plpgsql VOLATILE;


CREATE OR REPLACE FUNCTION mathesar_internal.update_pk_sequence_to_latest(text, text, text) RETURNS TEXT
  AS $$
    DECLARE qualified_table_name TEXT;
    BEGIN
      qualified_table_name := format('%s.%s', quote_ident($1), quote_ident($2));
      RETURN mathesar_internal.update_pk_sequence_to_latest_internal(qualified_table_name, quote_ident($3));
    END;
$$
LANGUAGE plpgsql VOLATILE;


-- This section sets up an event trigger to make a Mathesar view: for use in event trigger

CREATE OR REPLACE FUNCTION mathesar_internal.create_mathesar_view(oid) RETURNS TEXT
  AS $$
    DECLARE viewname TEXT;
    DECLARE viewcols TEXT;
    BEGIN
      viewname := format('mathesar_internal.mv%s', $1);
      SELECT string_agg(format('%s AS c%s', quote_ident(attname), attnum), ', ')
        FROM pg_attribute
        WHERE attrelid=$1 AND attnum>0
      INTO viewcols;
      RETURN mathesar_internal.execute_ddl(
        'CREATE VIEW %s AS SELECT %s FROM %s', viewname, viewcols, $1::regclass::text
      );
    END;
$$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION mathesar_internal.create_mathesar_view()
  RETURNS event_trigger
  AS $$
  DECLARE dc record;
  BEGIN
    FOR dc IN SELECT * FROM pg_event_trigger_ddl_commands()
      LOOP
        IF dc.object_type='table' AND upper(dc.command_tag)<>'DROP TABLE'
        THEN
          PERFORM mathesar_internal.create_mathesar_view(dc.objid);
        END IF;
      END LOOP;
  END;
$$ LANGUAGE plpgsql;

DROP EVENT TRIGGER IF EXISTS create_mathesar_view;

CREATE EVENT TRIGGER create_mathesar_view ON ddl_command_end
  EXECUTE FUNCTION mathesar_internal.create_mathesar_view();

-- This section sets up a function to delete a Mathesar view before dropping its
-- underlying table.  Has to be called from the app layer, since it's not
-- possible (without a C extension) to get the info about an object in an event
-- trigger context before actually attempting to drop it.

CREATE OR REPLACE FUNCTION mathesar_internal.drop_mathesar_view(oid) RETURNS TEXT
  AS $$
    DECLARE viewname TEXT;
    BEGIN
      viewname := format('mathesar_internal.mv%s', $1);
      RETURN mathesar_internal.execute_ddl('DROP VIEW IF EXISTS %s', viewname);
    END;
$$
LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION mathesar_internal.drop_mathesar_view(text, text) RETURNS TEXT
  AS $$
    DECLARE tableid oid;
    BEGIN
      tableid := format('%s.%s', quote_ident($1), quote_ident($2))::regclass::oid;
      RETURN mathesar_internal.drop_mathesar_view(tableid);
    END;
$$
LANGUAGE plpgsql VOLATILE;
