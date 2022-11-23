CREATE TABLE "array_test" (
    id integer NOT NULL,
    "int_array_col" integer ARRAY,
    "text_array_col" text ARRAY
);

INSERT INTO "array_test"(int_array_col, text_array_col) VALUES
(1, ARRAY[]::integer[], ARRAY[]::text[]),
(2, ARRAY[1, 2, 3], ARRAY['Ford', 'BMW', 'Fiat']),
(3, ARRAY[2, 3, 4], ARRAY['Ram', 'Shyam', 'Radhika', 'Akshay', 'Prashant', 'Varun']),
(4, ARRAY[1, 2], ARRAY['BMW', 'Ford', 'Fiat'])
