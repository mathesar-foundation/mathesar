/*

This is a test schema for use in joinable table tests. It does not use custom
Mathesar types, and is inappropriate for those tests. It also doesn't have any
default generating sequences for primary key columns.

*/

CREATE TABLE universities (
    id integer PRIMARY KEY,
    name text
);

INSERT INTO "universities" VALUES
(1,'uni1'),
(2,'uni2');

CREATE TABLE academics (
    id integer PRIMARY KEY,
    name text,
    institution integer REFERENCES universities(id),
    advisor integer REFERENCES academics(id) -- self-referencing fkey
);

INSERT INTO "academics" VALUES
(1,'academic1',1,2),
(2,'academic2',1,3),
(3,'academic3',2,NULL);

CREATE TABLE publishers (
    id integer PRIMARY KEY,
    name text NOT NULL
);

INSERT INTO "publishers" VALUES
(1,'publisher1'),
(2,'publisher2');

CREATE TABLE journals (
    id integer PRIMARY KEY,
    title text NOT NULL,
    institution integer REFERENCES universities(id),
    publisher integer REFERENCES publishers(id)
);

INSERT INTO "journals" VALUES
(1,'journal1',1,1),
(2,'journal2',2,2);

CREATE TABLE articles (
    id integer PRIMARY KEY,
    title text NOT NULL,
    primary_author integer REFERENCES academics(id) NOT NULL,
    secondary_author integer REFERENCES academics(id),
    journal integer REFERENCES journals(id)
);

INSERT INTO "articles" VALUES
(1,'article1',1,2,1),
(2,'article2',2,1,1);
