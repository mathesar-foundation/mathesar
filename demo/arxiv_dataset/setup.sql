-- Authors

CREATE TABLE "Authors" (
    id SERIAL PRIMARY KEY,
    "Name" text UNIQUE
);

-- Categories

CREATE TABLE "Categories" (
    id SERIAL PRIMARY KEY,
    "Name" text UNIQUE
);

-- Links

CREATE TABLE "Links" (
    id SERIAL PRIMARY KEY,
    "URL" mathesar_types.uri UNIQUE
);

-- Papers

CREATE TABLE "Papers" (
    id SERIAL PRIMARY KEY,
    "Title" text,
    "Summary" text,
    "Journal reference" text,
    "Primary category" int references "Categories"(id),
    "Updated" timestamp,
    "Published" timestamp,
    "Comment" text,
    "DOI" text,
    "arXiv URL" mathesar_types.uri UNIQUE
);

-- Paper-Author map table

CREATE TABLE "Paper-Author Map" (
  paper_id int,
  author_id int,
  PRIMARY KEY (paper_id, author_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_author FOREIGN KEY(author_id) REFERENCES "Authors"(id)
);

-- Paper-Category map table

CREATE TABLE "Paper-Category Map" (
  paper_id int,
  category_id int,
  PRIMARY KEY (paper_id, category_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES "Categories"(id)
);

-- Paper-Link map table

CREATE TABLE "Paper-Link Map" (
  paper_id int,
  link_id int,
  PRIMARY KEY (paper_id, link_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_link FOREIGN KEY(link_id) REFERENCES "Links"(id)
);
