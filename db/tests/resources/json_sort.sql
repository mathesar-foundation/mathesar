CREATE TABLE "json_sort" (
    id integer NOT NULL,
    "json_array"  jsonb
);

INSERT INTO "json_sort" VALUES
(1, '[]'::jsonb),
(2, '["Ford", "BMW", "Fiat"]'::jsonb),
(3, '["Ram", "Shyam", "Radhika", "Akshay", "Prashant", "Varun"]'::jsonb),
(4, '[ "BMW", "Ford", "Fiat"]'::jsonb),
(5, '[ "BMW", "Ford", "Fiat", "Fiat"]'::jsonb),
(6, '[1, 2, 3]'::jsonb),
(7, '[2, 3, 4]'::jsonb),
(8, '[1, 2, false]'::jsonb),
(9, '[1, 2, true]'::jsonb),
(10, '[false, false, false]'::jsonb),
(11, '[true, true, false]'::jsonb);
