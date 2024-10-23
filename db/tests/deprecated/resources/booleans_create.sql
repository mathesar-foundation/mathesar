CREATE TABLE "boolean" (
    id integer NOT NULL,
    "boolean" boolean
);

CREATE SEQUENCE "boolean_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "boolean_id_seq" OWNED BY "boolean".id;

ALTER TABLE ONLY "boolean" ALTER COLUMN id SET DEFAULT nextval('"boolean_id_seq"'::regclass);

INSERT INTO "boolean" VALUES
(1, TRUE),
(2, FALSE),
(3, TRUE),
(4, TRUE);

SELECT pg_catalog.setval('"boolean_id_seq"', 1000, true);

ALTER TABLE ONLY "boolean"
    ADD CONSTRAINT "boolean_pkey" PRIMARY KEY (id);
