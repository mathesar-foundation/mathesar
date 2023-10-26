/*
This test schema is for mathesar_types.mathesar_json_array.
This solely tests the result of distinct_list_aggregation 
on SQL and JSON arrays.
*/

CREATE TABLE "Players" (
    id integer NOT NULL,
    "player" VARCHAR(255) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "ballon_dor" mathesar_types.mathesar_json_array,
    "titles" mathesar_types.mathesar_json_array
);

CREATE SEQUENCE "Players_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "Players_id_seq" OWNED BY "Players".id;

ALTER TABLE ONLY "Players" 
  ALTER COLUMN id SET DEFAULT nextval('"Players_id_seq"'::regclass);

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Lionel Messi', 'Argentina', '[2009, 2011, 2012, 2013, 2016, 2019, 2021]', '[{"world_cup": 1, "ucl": 4}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Cristiano Ronaldo', 'Portugal', '[2008, 2010, 2014, 2015, 2017]', '[{"world_cup": 0, "ucl": 5}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Michel Platini', 'France', '[1983, 1984, 1985]', '[{"world_cup": 0, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Johan Cruyff', 'Netherlands', '[1971, 1973, 1974]', '[{"world_cup": 0, "ucl": 3}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Marco van Basten', 'Netherlands', '[1988, 1992, 1993]', '[{"world_cup": 1, "ucl": 3}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Franz Beckenbauer', 'Germany', '[1972, 1976]', '[{"world_cup": 1, "ucl": 3}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Alfredo Di Stefano', 'Argentina', '[1957, 1959, 1960]', '[{"world_cup": 0, "ucl": 5}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Zinedine Zidane', 'France', '[1998]', '[{"world_cup": 1, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Ronaldo Nazario', 'Brazil', '[1997, 2002]', '[{"world_cup": 2, "ucl": 3}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Ronaldinho', 'Brazil', '[2005]', '[{"world_cup": 1, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Andrea Pirlo', 'Italy', '[2006]', '[{"world_cup": 1, "ucl": 2}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Gerd Muller', 'Germany', '[1970]', '[{"world_cup": 1, "ucl": 3}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Lev Yashin', 'Soviet Union', '[1963]', '[{"world_cup": 0, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Ferenc Puskas', 'Hungary', '[1959]', '[{"world_cup": 0, "ucl": 3}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('George Weah', 'Liberia', '[1995]', '[{"world_cup": 0, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Rivaldo', 'Brazil', '[1999]', '[{"world_cup": 1, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Fabio Cannavaro', 'Italy', '[2006]', '[{"world_cup": 1, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Lothar Matthaus', 'Germany', '[1990]', '[{"world_cup": 1, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Garrincha', 'Brazil', '[1962]', '[{"world_cup": 2, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Kaka', 'Brazil', '[2007]', '[{"world_cup": 1, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Luigi Riva', 'Italy', '[1969]', '[{"world_cup": 0, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Roberto Baggio', 'Italy', '[1993]', '[{"world_cup": 0, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Bobby Charlton', 'England', '[1966]', '[{"world_cup": 1, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Raymond Kopa', 'France', '[1958]', '[{"world_cup": 0, "ucl": 0}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Luka Modric', 'Croatia', '[2018]', '[{"world_cup": 0, "ucl": 4}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Andriy Shevchenko', 'Ukraine', '[2004]', '[{"world_cup": 0, "ucl": 1}]');

INSERT INTO "Players" ("player", "country", "ballon_dor", "titles")
VALUES ('Oleg Blokhin', 'Soviet Union', '[1975]', '[{"world_cup": 0, "ucl": 0}]');
