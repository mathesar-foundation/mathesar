import { type Table, runSqlInSchema } from '../../support/api/mathesar';
import { test as base } from '../../support/fixtures';
import { DataExplorerPage } from '../../support/ui/pages/data-explorer-page';

export interface Library {
  authors: Table;
  books: Table;
  loans: Table;
}

interface LibraryFixtures {
  /**
   * Three tables: a loan references a book, a book references an author.
   * The last book has a title only.
   */
  library: Library;
  dataExplorer: DataExplorerPage;
}

export const test = base.extend<LibraryFixtures>({
  library: async ({ api, schema }, use) => {
    await runSqlInSchema(
      schema,
      `CREATE TABLE "Authors" (id integer PRIMARY KEY, "Name" text, "Country" text);
       INSERT INTO "Authors" VALUES
         (1, 'Ursula Le Guin', 'US'),
         (2, 'Italo Calvino', 'IT'),
         (3, 'Jorge Borges', 'AR');
       CREATE TABLE "Books" (
         id integer PRIMARY KEY,
         "Title" text,
         "Pages" integer,
         "Price" numeric,
         "Published" date,
         "In Stock" boolean,
         "Author" integer REFERENCES "Authors" (id)
       );
       INSERT INTO "Books" VALUES
         (1, 'The Dispossessed', 387, 12.5, '1974-05-01', true, 1),
         (2, 'The Lathe of Heaven', 184, 9.99, '1971-03-15', false, 1),
         (3, 'Invisible Cities', 165, 11, '1972-11-03', true, 2),
         (4, 'Ficciones', 203, 14.25, '1944-06-20', true, 3),
         (5, 'Untitled', NULL, NULL, NULL, NULL, NULL);
       CREATE TABLE "Loans" (
         id integer PRIMARY KEY,
         "Book" integer REFERENCES "Books" (id),
         "Borrower" text,
         "Due" date
       );
       INSERT INTO "Loans" VALUES
         (1, 1, 'Ana', '2024-01-10'),
         (2, 1, 'Ben', '2024-02-11'),
         (3, 3, 'Cy', '2024-03-12');`,
    );
    await use({
      authors: await api.getTable(schema, 'Authors'),
      books: await api.getTable(schema, 'Books'),
      loans: await api.getTable(schema, 'Loans'),
    });
  },

  dataExplorer: async ({ page }, use) => {
    await use(new DataExplorerPage(page));
  },
});

export { expect } from '../../support/fixtures';
