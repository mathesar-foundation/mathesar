CREATE TABLE "json_without_pkey" (
    "json_object" mathesar_types.mathesar_json_object
);

INSERT INTO "json_without_pkey" VALUES
('{"name": "John", "age": 30}'::mathesar_types.mathesar_json_object),
('{"name": "Earl James", "age": 30}'::mathesar_types.mathesar_json_object);