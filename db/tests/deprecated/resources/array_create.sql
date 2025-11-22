CREATE TABLE "array_test" (
    id SERIAL PRIMARY KEY,
    "int_array_col" integer ARRAY,
    "text_array_col" text ARRAY
);

INSERT INTO "array_test"(int_array_col, text_array_col) VALUES
(ARRAY[]::integer[], ARRAY[]::text[]),
(ARRAY[1, 2, 3], ARRAY['Ford', 'BMW', 'Fiat']),
(ARRAY[2, 3, 4], ARRAY['Ram', 'Shyam', 'Radhika', 'Akshay', 'Prashant', 'Varun']),
(ARRAY[1, 4, 3], ARRAY['BMW', 'Ford', 'Fiat']),
(ARRAY[1, 7, 4, 2, 6], ARRAY['BMW', 'Ford', 'Fiat']),
(ARRAY[1, 4, 7], ARRAY['Tesla', 'Ferrari', 'Porsche']),
(ARRAY[4, 7], ARRAY['Lexus', 'Corvette', 'Dodge']),
(ARRAY[0, 0, 7], ARRAY['Aston Martin', 'Mustang', 'Hornet', 'Rolls Royce']),
(ARRAY[1, 8, 6], ARRAY['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']),
(ARRAY[3, 1, 4], ARRAY['Foxtrot', 'Golf', 'Hotel']),
(ARRAY[2, 7, 1], ARRAY['India', 'Juliet', 'Kilo']),
(ARRAY[1, 6, 1], ARRAY['Lima', 'Mike', 'November']);
