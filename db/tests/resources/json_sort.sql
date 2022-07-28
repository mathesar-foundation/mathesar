CREATE TABLE "json_sort" (
    id integer NOT NULL,
    "json_array"  mathesar_types.mathesar_json_array
);

INSERT INTO "json_sort" VALUES
(1, '[]'::mathesar_types.mathesar_json_array),
(2, '["Ford", "BMW", "Fiat"]'::mathesar_types.mathesar_json_array),
(3, '["Ram", "Shyam", "Radhika", "Akshay", "Prashant", "Varun"]'::mathesar_types.mathesar_json_array),
(4, '["BMW", "Ford", "Fiat"]'::mathesar_types.mathesar_json_array),
(5, '["BMW", "Ford", "Fiat", "Fiat"]'::mathesar_types.mathesar_json_array),
(6, '[1, 2, 3]'::mathesar_types.mathesar_json_array),
(7, '[2, 3, 4]'::mathesar_types.mathesar_json_array),
(8, '[1, 2, false]'::mathesar_types.mathesar_json_array),
(9, '[1, 2, true]'::mathesar_types.mathesar_json_array),
(10, '[false, false, false]'::mathesar_types.mathesar_json_array),
(11, '[true, true, false]'::mathesar_types.mathesar_json_array),
(12, '["BMW", "Ford", [1, 2]]'::mathesar_types.mathesar_json_array),
(13, '["BMW", "Ford", [1, 2, 3]]'::mathesar_types.mathesar_json_array),
(14, '["BMW", "Ford", ["Akshay", "Prashant", "Varun"]]'::mathesar_types.mathesar_json_array);
