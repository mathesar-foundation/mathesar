DROP EXTENSION IF EXISTS pgtap CASCADE;
CREATE EXTENSION IF NOT EXISTS pgtap;

CREATE OR REPLACE FUNCTION __setup_record_summary_data() RETURNS SETOF TEXT AS $$
BEGIN
  CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name TEXT
  );
  INSERT INTO authors (name) VALUES
    ('Alice'),   -- id 1
    ('Bob'),     -- id 2
    ('Charlie'); -- id 3
  CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT,
    author_id INT REFERENCES authors(id),
    year_published INT
  );
  INSERT INTO books (title, author_id, year_published) values
    ('Apple'    , 1, 2001), -- id 1
    ('Asparagus', 1, 2002), -- id 2
    ('Banana'   , 2, 2003), -- id 3
    ('Broccoli' , 2, 2004), -- id 4
    ('Carrot'   , 3, 2005); -- id 5
  CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    book_id INT REFERENCES books(id),
    barcode TEXT
  );
  INSERT INTO items (book_id, barcode) VALUES
    (1, 'FH'), -- id 1
    (1, 'DQ'), -- id 2
    (2, 'MW'), -- id 3
    (3, 'BR'), -- id 4
    (4, 'SN'), -- id 5
    (5, 'ZA'); -- id 6
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_basic() RETURNS SETOF TEXT AS $t$
BEGIN
  PERFORM __setup_record_summary_data();

  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries('books'::regclass::oid, array[4,4,4,4])$$,
    $$VALUES (4, 'Broccoli')$$,
    'Duplicate input ids should be made distinct in the output'
  );

  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries('books'::regclass::oid, array[1,3,5])$$,
    $$VALUES (1, 'Apple'), (3, 'Banana'), (5, 'Carrot')$$,
    'Auto-generated record summaries for books'
  );

  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries(
      'books'::regclass::oid,
      array[1,3,5],
      '[[2]," by ", [3,2]]'::jsonb
    )$$,
    $$VALUES
      (1, 'Apple by Alice'),
      (3, 'Banana by Bob'),
      (5, 'Carrot by Charlie')
    $$,
    'Custom record summaries for books'
  );

  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries(
      'items'::regclass::oid,
      array[3,4],
      '[[3],": ",[2,2]," by ",[2,3,2]]'::jsonb
    )$$,
    $$VALUES
      (3, 'MW: Asparagus by Alice'),
      (4, 'BR: Banana by Bob')
    $$,
    'Custom record summaries for items'
  );
END;
$t$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_with_empty_template() RETURNS SETOF TEXT AS $t$
BEGIN
  PERFORM __setup_record_summary_data();
  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries('books'::regclass::oid, array[1], '[]'::jsonb)$$,
    $$VALUES (1, '?')$$,
    'Record summary with empty template'
  );
END;
$t$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_with_invalid_attnum() RETURNS SETOF TEXT AS $t$
BEGIN
  PERFORM __setup_record_summary_data();
  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries(
      'books'::regclass::oid,
      array[1],
      '[[2]," - ",[98],[99,2]," - ",[4]]'::jsonb
    )$$,
    $$VALUES (1, 'Apple -  - 2001')$$,
    'Invalid column attnums in template should be disregarded'
  );
END;
$t$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_with_invalid_fk_column() RETURNS SETOF TEXT AS $t$
BEGIN
  PERFORM __setup_record_summary_data();
  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries(
      'books'::regclass::oid,
      array[1],
      -- [4,2] should be ignored here. 4 is a valid attnum, but it's not an FK column
      '[[2]," - ",[4,2]]'::jsonb
    )$$,
    $$VALUES (1, 'Apple - ')$$,
    'Invalid FK columns in template should be disregarded'
  );
END;
$t$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_with_funky_characters() RETURNS SETOF TEXT AS $t$
BEGIN
  PERFORM __setup_record_summary_data();
  RETURN NEXT bag_eq(
    $q$SELECT * FROM msar.get_record_summaries(
      'books'::regclass::oid,
      array[1],
      '[[2]," $$;''\""]'::jsonb
    )$q$,
    $v$VALUES (1, 'Apple $$;''"')$v$,
    'Record summaries should permit SQL quotes and delimiters as literal values'
  );
END;
$t$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION _summarize(id INT) RETURNS TEXT AS $$
BEGIN
  UPDATE counter SET count = count + 1;
  RETURN 'Number: ' || id::text;
END;
$$ LANGUAGE plpgsql;

-- This is test is skipped because it's currently failing. We'd like to call the `summarize`
-- function only 4 times, but instead we're calling it 1000 times. We need to do some work
-- within get_record_summaries_via_query to figure out how to fix this.
CREATE OR REPLACE FUNCTION __SKIP__test_record_summary_performance() RETURNS SETOF TEXT AS $t$
BEGIN
  CREATE TABLE numbers AS SELECT * FROM generate_series(1, 1000) AS id;
  ALTER TABLE numbers ADD CONSTRAINT pk__numbers_id PRIMARY KEY (id);

  CREATE TABLE counter AS SELECT 0 AS count;

  RETURN NEXT bag_eq(
    $r$SELECT * FROM msar.get_record_summaries_via_query(
      $q$SELECT id, _summarize(id) AS record_summary FROM numbers$q$,
      array[950,10,400,700]
    )$r$,
    $r$VALUES
      (950, 'Number: 950'),
      (10,  'Number: 10'),
      (400, 'Number: 400'),
      (700, 'Number: 700')
    $r$,
    'Performance test values should match'
  );

  RETURN NEXT results_eq(
    $$SELECT * FROM COUNTER$$,
    $$VALUES (4)$$,
    'Summarization computation should only occur for specified records'
  );
END;
$t$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_with_text_pk_column() RETURNS SETOF TEXT AS $t$
BEGIN
  CREATE TABLE things (
    name text primary key,
    description text
  );
  INSERT INTO things VALUES
    ('foo', 'YEAH'),
    ('bar', 'NO');

  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries('things'::regclass::oid, array['foo', 'bar'])$$,
    $$VALUES ('foo', 'foo'), ('bar', 'bar');$$,
    'Record summary should auto-select PK column when it''s text'
  );
END;
$t$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_record_summary_with_no_text_columns() RETURNS SETOF TEXT AS $t$
BEGIN
  CREATE TABLE points (
    id_value UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position point
  );
  INSERT INTO points VALUES
    ('f8d0a39a-70ca-4a11-8ffc-4a44ebc66898'::uuid, point(0,0)),
    ('cfa72e14-34a1-4ee9-a7bf-9aaf93acc275'::uuid, point(1,1));

  RETURN NEXT bag_eq(
    $$SELECT * FROM msar.get_record_summaries(
      'points'::regclass::oid,
      array[ 'f8d0a39a-70ca-4a11-8ffc-4a44ebc66898'::uuid ]
    )$$,
    $$VALUES (
      'f8d0a39a-70ca-4a11-8ffc-4a44ebc66898'::uuid,
      'f8d0a39a-70ca-4a11-8ffc-4a44ebc66898'
    )$$,
    'Record summary should work even when no columns are text'
  );
END;
$t$ LANGUAGE plpgsql;
