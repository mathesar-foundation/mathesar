CREATE TABLE "json_without_pkey" (
    "json_object" json
);

INSERT INTO "json_without_pkey" VALUES
('{"name": "John", "age": 30}'::json),
('{"name": "Earl James", "age": 30}'::json);
