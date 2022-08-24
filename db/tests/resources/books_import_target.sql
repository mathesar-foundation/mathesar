CREATE TABLE "books_target"(
id SERIAL PRIMARY KEY,
"title" TEXT,
"author" TEXT);

INSERT INTO "books_target"(title, author) VALUES ('Steve Jobs', 'Walter Issacson'), ('The Idiot', 'Fyodor Dostevsky'), ('David Copperfield', 'Charles Darwin');
