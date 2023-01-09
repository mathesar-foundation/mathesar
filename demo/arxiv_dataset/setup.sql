-- Authors

CREATE TABLE "Authors" (
    "Name" text PRIMARY KEY
);

-- Categories

CREATE TABLE "Categories" (
    "Name" text PRIMARY KEY
);

-- Links

CREATE TABLE "Links" (
    "HREF" mathesar_types.uri PRIMARY KEY
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
    "Primary category" text references "Categories"("Name")
);

-- Paper-Author bridge table

CREATE TABLE "Paper-Author" (
  paper_id text,
  author_id text,
  PRIMARY KEY (paper_id, author_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_author FOREIGN KEY(author_id) REFERENCES "Authors"("Name")
);

-- Paper-Category bridge table

CREATE TABLE "Paper-Category" (
  paper_id text,
  category_id text,
  PRIMARY KEY (paper_id, category_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES "Categories"("Name")
);

-- Paper-Link bridge table

CREATE TABLE "Paper-Link" (
  paper_id text,
  link_id text,
  PRIMARY KEY (paper_id, link_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_link FOREIGN KEY(link_id) REFERENCES "Links"("HREF")
);
