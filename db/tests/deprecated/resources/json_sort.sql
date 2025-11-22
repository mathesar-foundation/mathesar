CREATE TABLE "json_sort" (
    id integer NOT NULL,
    "json_array"  mathesar_types.mathesar_json_array,
    "json_object" mathesar_types.mathesar_json_object
);

INSERT INTO "json_sort" VALUES
(1, '[]'::mathesar_types.mathesar_json_array, '{"name": "John", "age": 30}'::mathesar_types.mathesar_json_object),
(2, '["Ford", "BMW", "Fiat"]'::mathesar_types.mathesar_json_array, '{}'::mathesar_types.mathesar_json_object),
(3, '["Ram", "Shyam", "Radhika", "Akshay", "Prashant", "Varun"]'::mathesar_types.mathesar_json_array, '{"name": "John"}'::mathesar_types.mathesar_json_object),
(4, '["BMW", "Ford", "Fiat"]'::mathesar_types.mathesar_json_array, '{"name": "John", "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(5, '["BMW", "Ford", "Fiat", "Fiat"]'::mathesar_types.mathesar_json_array, '{"name": "Amy", "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(6, '[1, 2, 3]'::mathesar_types.mathesar_json_array, '{"name1": "John", "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(7, '[2, 3, 4]'::mathesar_types.mathesar_json_array, '{"30": "age", "name": "John", "car": null}'::mathesar_types.mathesar_json_object),
(8, '[1, 2, false]'::mathesar_types.mathesar_json_array, '{"name": false, "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(9, '[1, 2, true]'::mathesar_types.mathesar_json_array, '{"name": true, "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(10, '[false, false, false]'::mathesar_types.mathesar_json_array, '{"name": 11, "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(11, '[true, true, false]'::mathesar_types.mathesar_json_array, '{"name": 12, "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(12, '["BMW", "Ford", [1, 2]]'::mathesar_types.mathesar_json_array, '{"name": null, "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(13, '["BMW", "Ford", [1, 2, 3]]'::mathesar_types.mathesar_json_array, '{"name": "John11", "age": 30, "car": null}'::mathesar_types.mathesar_json_object),
(14, '["BMW", "Ford", ["Akshay", "Prashant", "Varun"]]'::mathesar_types.mathesar_json_array, '{"name": "John", "age11": 30, "car": null}'::mathesar_types.mathesar_json_object);
