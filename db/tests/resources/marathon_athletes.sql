CREATE TABLE "Marathon" (
  id integer NOT NULL,
  "athlete" VARCHAR(255),
  "gender" VARCHAR(255),
  "finish time" Interval,
  "city" VARCHAR(255)
);

CREATE SEQUENCE "Marathon_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Marathon_id_seq" OWNED BY "Marathon".id;

ALTER TABLE ONLY "Marathon" 
  ALTER COLUMN id SET DEFAULT nextval('"Marathon_id_seq"'::regclass);

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Eliud Kipchoge', 'Male', 'PT2H1M39S', 'Berlin');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Brigid Kosgei', 'Female', 'PT2H14M4S', 'Chicago');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Dennis Kimetto', 'Male', 'PT2H2M57S', 'Berlin');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Paula Radcliffe', 'Female', 'PT2H15M25S', 'London');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Haile Gebrselassie', 'Male', 'PT2H3M59S', 'Berlin');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Mary Keitany', 'Female', 'PT2H18M35S', 'London');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Geoffrey Kamworor', 'Male', 'PT2H4M0S', 'Berlin');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Tirunesh Dibaba', 'Female', 'PT2H17M56S', 'London');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Wilson Kipsang', 'Male', 'PT2H3M23S', 'Berlin');

INSERT INTO "Marathon" ("athlete", "gender", "finish time", "city") VALUES
('Florence Kiplagat', 'Female', 'PT2H17M45S', 'Chicago');

