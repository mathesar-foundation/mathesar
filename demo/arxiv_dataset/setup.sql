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
    "Title" text,
    "Summary" text,
    "Journal reference" text,
    "Primary category" text references "Categories"("Name")
    "Updated" timestamp,
    "Published" timestamp,
    "Comment" text,
    "DOI" text,
);

-- Paper-Author map table

CREATE TABLE "Paper-Author Map" (
  paper_id text,
  author_id text,
  PRIMARY KEY (paper_id, author_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_author FOREIGN KEY(author_id) REFERENCES "Authors"("Name")
);

-- Paper-Category map table

CREATE TABLE "Paper-Category Map" (
  paper_id text,
  category_id text,
  PRIMARY KEY (paper_id, category_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_category FOREIGN KEY(category_id) REFERENCES "Categories"("Name")
);

-- Paper-Link map table

CREATE TABLE "Paper-Link Map" (
  paper_id text,
  link_id text,
  PRIMARY KEY (paper_id, link_id),
  CONSTRAINT fk_paper FOREIGN KEY(paper_id) REFERENCES "Papers"(id),
  CONSTRAINT fk_link FOREIGN KEY(link_id) REFERENCES "Links"("HREF")
);
