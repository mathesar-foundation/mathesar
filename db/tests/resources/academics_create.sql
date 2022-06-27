/*

This is a test schema for use in joinable table tests. It does not use custom
Mathesar types, and is inappropriate for those tests. It also doesn't have any
default generating sequences for primary key columns.

*/

CREATE TABLE academics (
    id integer PRIMARY KEY,
    name text,
    institution integer REFERENCES universities(id),
    advisor integer REFERENCES academics(id) -- self-referencing fkey
);

CREATE TABLE universities (
    id integer PRIMARY KEY,
    name text,
);

CREATE TABLE journals (
    id integer PRIMARY KEY,
    title text NOT NULL,
    institution integer REFERENCES universities(id),
    publisher text REFERENCES publishers(id)
);

CREATE TABLE articles (
    id integer PRIMARY KEY,
    title text NOT NULL,
    primary_author text REFERENCES academics(id) NOT NULL,
    secondary_author text REFERENCES academics(id),
    journal text REFERENCES journals(id)
);
