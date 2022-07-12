CREATE TABLE "Person" (
    id integer NOT NULL UNIQUE PRIMARY KEY,
    "Name" character varying(100),
    "Email" mathesar_types.email

);
CREATE SEQUENCE "Person_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Person_id_seq" OWNED BY "Person".id;

ALTER TABLE ONLY "Person" ALTER COLUMN id SET DEFAULT nextval('"Person_id_seq"'::regclass);

CREATE TABLE "Subject" (
    id integer NOT NULL UNIQUE PRIMARY KEY,
    "person" integer REFERENCES "Person"(id),
    "teacher" integer REFERENCES "Person"(id),
    supplementary integer REFERENCES "Subject"(id),
    "Name" character varying(20),
    "Score" integer

);

CREATE SEQUENCE "Subject_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Subject_id_seq" OWNED BY "Subject".id;

ALTER TABLE ONLY "Subject" ALTER COLUMN id SET DEFAULT nextval('"Subject_id_seq"'::regclass);

INSERT INTO "Person" VALUES
(1, 'Stephanie Norris', 'stephanienorris@hotmail.com'),
(2, 'Shannon Ramos', 'shannonramos@gmail.com'),
(3, 'Tyler Harris', 'tylerharris@hotmail.com'),
(4, 'Lee Henderson', 'leehenderson@yahoo.com'),
(5, 'Christopher Bell', 'christopherbell@hotmail.com'),
(6, 'Mary Carroll', 'marycarroll@hotmail.com'),
(7, 'Judy Martinez', 'judymartinez@gmail.com'),
(8, 'Evelyn Anderson', 'evelynanderson@hotmail.com'),
(9, 'Bethany Bell', 'bethanybell@gmail.com'),
(10, 'Carolyn Durham', 'carolyndurham@gmail.com');

INSERT INTO "Subject" VALUES
(1, 1, 6, NULL, 'Physics', 43),
(2, 1, 8, 1, 'P.E.', 37),
(3, 1, 8, NULL, 'Chemistry', 55),
(4, 1, 8, NULL, 'Biology', 41),
(5, 1, 6, NULL, 'Physics', 62),
(6, 2, 6, NULL, 'Math', 44),
(7, 2, 9, NULL, 'Reading', 56),
(8, 2, 10, 3, 'Art', 31),
(9, 2, 10, 3, 'Art', 77),
(10, 2, 9, NULL, 'Music', 40),
(11, 3, 6, NULL, 'Math', 92),
(12, 3, 10, NULL, 'History', 87),
(13, 3, 9, NULL, 'Reading', 30),
(14, 3, 10, NULL, 'Art', 66),
(15, 3, 8, NULL, 'Chemistry', 81),
(16, 4, 8, NULL, 'Chemistry', 59),
(17, 4, 10, NULL, 'History', 33),
(18, 4, 9, NULL, 'Reading', 82),
(19, 4, 10, 6, 'Art', 95),
(20, 4, 9, NULL, 'Reading', 93),
(21, 5, 6, NULL, 'Math', 67),
(22, 5, 10, NULL, 'Art', 62),
(23, 5, 6, NULL, 'Math', 65),
(24, 5, 10, 10, 'History', 47),
(25, 5, 8, 1, 'Chemistry', 44)
