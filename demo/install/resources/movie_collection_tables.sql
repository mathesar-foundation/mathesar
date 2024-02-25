CREATE SCHEMA "Movie Collection";
SET search_path="Movie Collection";
-- Departments

CREATE TABLE "Departments" (
    id integer NOT NULL,
    "Name" text
);

CREATE SEQUENCE "Departments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Departments_id_seq" OWNED BY "Departments".id;

ALTER TABLE ONLY "Departments"
  ALTER COLUMN id SET DEFAULT nextval('"Departments_id_seq"'::regclass);


-- Genres

CREATE TABLE "Genres" (
    id integer NOT NULL,
    "Name" text
);


CREATE SEQUENCE "Genres_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Genres_id_seq" OWNED BY "Genres".id;

ALTER TABLE ONLY "Genres"
  ALTER COLUMN id SET DEFAULT nextval('"Genres_id_seq"'::regclass);


-- Jobs

CREATE TABLE "Jobs" (
    id integer NOT NULL,
    "Name" text
);

CREATE SEQUENCE "Jobs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Jobs_id_seq" OWNED BY "Jobs".id;

ALTER TABLE ONLY "Jobs"
  ALTER COLUMN id SET DEFAULT nextval('"Jobs_id_seq"'::regclass);


-- Movie Cast Map

CREATE TABLE "Movie Cast Map" (
    id integer NOT NULL,
    "Character" text,
    "Movie" integer NOT NULL,
    "Cast Member" integer NOT NULL,
    "Credit Order" integer
);

CREATE SEQUENCE "Movie Cast Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movie Cast Map_id_seq" OWNED BY "Movie Cast Map".id;

ALTER TABLE ONLY "Movie Cast Map"
  ALTER COLUMN id SET DEFAULT nextval('"Movie Cast Map_id_seq"'::regclass);


-- Movie Crew Map

CREATE TABLE "Movie Crew Map" (
    id integer NOT NULL,
    "Job" integer,
    "Department" integer,
    "Movie" integer NOT NULL,
    "Crew Member" integer NOT NULL
);

CREATE SEQUENCE "Movie Crew Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movie Crew Map_id_seq" OWNED BY "Movie Crew Map".id;

ALTER TABLE ONLY "Movie Crew Map"
  ALTER COLUMN id SET DEFAULT nextval('"Movie Crew Map_id_seq"'::regclass);


-- Movie Genre Map

CREATE TABLE "Movie Genre Map" (
    id integer NOT NULL,
    "Movie" integer,
    "Genre" integer
);

CREATE SEQUENCE "Movie Genre Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movie Genre Map_id_seq" OWNED BY "Movie Genre Map".id;

ALTER TABLE ONLY "Movie Genre Map"
  ALTER COLUMN id SET DEFAULT nextval('"Movie Genre Map_id_seq"'::regclass);


-- Movie Production Company Map

CREATE TABLE "Movie Production Company Map" (
    id integer NOT NULL,
    "Movie" integer,
    "Production Company" integer
);

CREATE SEQUENCE "Movie Production Company Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movie Production Company Map_id_seq" OWNED BY "Movie Production Company Map".id;

ALTER TABLE ONLY "Movie Production Company Map"
  ALTER COLUMN id SET DEFAULT nextval('"Movie Production Company Map_id_seq"'::regclass);


-- Movie Production Country Map

CREATE TABLE "Movie Production Country Map" (
    id integer NOT NULL,
    "Movie" integer NOT NULL,
    "Production Country" integer NOT NULL
);

CREATE SEQUENCE "Movie Production Country Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movie Production Country Map_id_seq" OWNED BY "Movie Production Country Map".id;

ALTER TABLE ONLY "Movie Production Country Map"
  ALTER COLUMN id SET DEFAULT nextval('"Movie Production Country Map_id_seq"'::regclass);


-- Movie Spoken Language Map

CREATE TABLE "Movie Spoken Language Map" (
    id integer NOT NULL,
    "Movie" integer NOT NULL,
    "Spoken Language" integer NOT NULL
);

CREATE SEQUENCE "Movie Spoken Language Map_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movie Spoken Language Map_id_seq" OWNED BY "Movie Spoken Language Map".id;

ALTER TABLE ONLY "Movie Spoken Language Map"
  ALTER COLUMN id SET DEFAULT nextval('"Movie Spoken Language Map_id_seq"'::regclass);


-- Movies

CREATE TABLE "Movies" (
    id integer NOT NULL,
    "Title" text,
    "Release Date" date,
    "Runtime" numeric,
    "Homepage" mathesar_types.uri,
    "Sub-Collection" integer,
    "Imdb ID" text,
    "Tagline" text,
    "Overview" text,
    "Budget" mathesar_types.mathesar_money,
    "Revenue" mathesar_types.mathesar_money,
    "Original Title" text,
    "Original Language" text
);

CREATE SEQUENCE "Movies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Movies_id_seq" OWNED BY "Movies".id;

ALTER TABLE ONLY "Movies"
  ALTER COLUMN id SET DEFAULT nextval('"Movies_id_seq"'::regclass);


-- People

CREATE TABLE "People" (
    id integer NOT NULL,
    "Name" text
);

CREATE SEQUENCE "People_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "People_id_seq" OWNED BY "People".id;

ALTER TABLE ONLY "People"
  ALTER COLUMN id SET DEFAULT nextval('"People_id_seq"'::regclass);


-- Production Companies

CREATE TABLE "Production Companies" (
    id integer NOT NULL,
    "Name" text
);

CREATE SEQUENCE "Production Companies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Production Companies_id_seq" OWNED BY "Production Companies".id;

ALTER TABLE ONLY "Production Companies"
  ALTER COLUMN id SET DEFAULT nextval('"Production Companies_id_seq"'::regclass);


-- Production Countries

CREATE TABLE "Production Countries" (
    id integer NOT NULL,
    "Name" text NOT NULL,
    "ISO 3166-1" character(2) NOT NULL
);

CREATE SEQUENCE "Production Countries_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Production Countries_id_seq" OWNED BY "Production Countries".id;

ALTER TABLE ONLY "Production Countries"
  ALTER COLUMN id SET DEFAULT nextval('"Production Countries_id_seq"'::regclass);


-- Spoken Languages

CREATE TABLE "Spoken Languages" (
    id integer NOT NULL,
    "Name" text,
    "ISO 639-1" character(2) NOT NULL
);

CREATE SEQUENCE "Spoken Languages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Spoken Languages_id_seq" OWNED BY "Spoken Languages".id;

ALTER TABLE ONLY "Spoken Languages"
  ALTER COLUMN id SET DEFAULT nextval('"Spoken Languages_id_seq"'::regclass);


-- Sub-Collections

CREATE TABLE "Sub-Collections" (
    id integer NOT NULL,
    "Name" text
);

CREATE SEQUENCE "Sub-Collections_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Sub-Collections_id_seq" OWNED BY "Sub-Collections".id;

ALTER TABLE ONLY "Sub-Collections"
  ALTER COLUMN id SET DEFAULT nextval('"Sub-Collections_id_seq"'::regclass);
