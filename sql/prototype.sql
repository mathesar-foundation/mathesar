/*
Functions for testing feasibility of moving different Mathesar pieces to the database.
*/

CREATE SCHEMA mathesar_internal;

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


/*
db.tables.operations.alter
*/

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
