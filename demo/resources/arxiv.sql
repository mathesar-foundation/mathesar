-- Authors

CREATE TABLE "Authors" (
    id SERIAL PRIMARY KEY,
    "Name" text
);

-- Categories

CREATE TABLE "Categories" (
    id SERIAL PRIMARY KEY,
    "Name" text
);

-- Links

CREATE TABLE "Links" (
    id SERIAL PRIMARY KEY,
    "URL" mathesar_types.uri
);

-- Papers

CREATE TABLE "Papers" (
    id text PRIMARY KEY,
    "Updated" timestamp,
    "Published" timestamp,
    "Title" text,
    "Summary" text,
    "Comment" text,
    "Journal reference" text,
    "DOI" text,
    "Primary category" integer
);

-- Paper-Author bridge table

CREATE TABLE "Paper-Author" (
  paper_id integer,
  author_id integer,
  PRIMARY KEY (paper_id, author_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES Papers(id),
  CONSTRAINT fk_author FOREIGN KEY(author_id) REFERENCES Authors(id)
);

-- Paper-Category bridge table

CREATE TABLE "Paper-Category" (
  paper_id integer,
  category_id integer,
  PRIMARY KEY (paper_id, category_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES Papers(id),
  CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES Categories(id)
);

-- Paper-Link bridge table

CREATE TABLE "Paper-Link" (
  paper_id integer,
  link_id integer,
  PRIMARY KEY (paper_id, link_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES Papers(id),
  CONSTRAINT fk_link FOREIGN KEY(link_id) REFERENCES Links(id)
);
