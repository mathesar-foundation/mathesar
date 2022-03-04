CREATE TABLE "times" (
    id integer NOT NULL,
    "time" time,
    "date" date,
    "timestamp" timestamp,
    "interval" interval
);

CREATE SEQUENCE "times_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "times_id_seq" OWNED BY "times".id;

ALTER TABLE ONLY "times" ALTER COLUMN id SET DEFAULT nextval('"times_id_seq"'::regclass);

INSERT INTO "times" VALUES
(1, '04:05:06.789', '1999-01-08', '1999-01-08 04:05:06 -8:00', 'P1Y2M3DT4H5M6S'),
(2, '06:05:06.789', '2010-01-08', '1980-01-08 04:05:06 -8:00', 'P5Y2M3DT4H5M6S'),
(3, '01:05:06.789', '2013-01-08', '1981-01-08 04:05:06 -8:00', 'P3Y5M3DT4H5M6S');

SELECT pg_catalog.setval('"times_id_seq"', 1000, true);

ALTER TABLE ONLY "times"
    ADD CONSTRAINT "times_pkey" PRIMARY KEY (id);
