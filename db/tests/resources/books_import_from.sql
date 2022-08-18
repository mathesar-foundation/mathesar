CREATE TABLE "books_from"(
id SERIAL PRIMARY KEY,
"author_name" TEXT,
"book_title" TEXT);

INSERT INTO "books_from"(author_name, book_title) VALUES ('Fyodor Dostoevsky', 'Crime and Punishment'), ('Cervantes', 'Don Quixote');
