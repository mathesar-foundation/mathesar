import { type Schema, runSqlInSchema } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { failRpcMethod } from '../../support/rpc-failures';
import { chooseColumn } from '../../support/ui/components/column-options';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { tooltip } from '../../support/ui/components/tooltip';
import { TableConstraints } from '../../support/ui/pages/table-constraints';
import { TablePage } from '../../support/ui/pages/table-page';
import { TableRelationships } from '../../support/ui/pages/table-relationships';
import { expect, foreignKeys, test } from './library';

interface Constraint {
  name: string;
  columns: string;
}

/** The unique constraints of "Books" in PostgreSQL, with their columns in order. */
function uniqueConstraintsOfBooks(schema: Schema): Promise<Constraint[]> {
  return runSqlInSchema<Constraint>(
    schema,
    `SELECT c.conname AS name,
       string_agg(a.attname, ', ' ORDER BY k.ord) AS columns
     FROM pg_constraint c
       CROSS JOIN unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
       JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
     WHERE c.contype = 'u' AND c.conrelid = '"Books"'::regclass
     GROUP BY c.conname
     ORDER BY c.conname`,
  );
}

test.describe('the constraints of a table', () => {
  let tablePage: TablePage;
  let constraints: TableConstraints;

  test.beforeEach(async ({ page, library }) => {
    tablePage = new TablePage(page);
    constraints = new TableConstraints(page);
    await tablePage.goto(library.books);
    await constraints.open();
  });

  test('are listed by kind, each with its name and, for a foreign key, its target', async () => {
    const primaryKeys = constraints.section('Primary Keys');
    const foreignKeySection = constraints.section('Foreign Keys');
    const author = foreignKeySection.constraint('Author');

    await expect(primaryKeys.constraints).toHaveCount(1);
    await expect(primaryKeys.addButton).toHaveCount(0);
    await expect(foreignKeySection.constraints).toHaveCount(2);
    await expect(foreignKeySection.constraint('Publisher')).toHaveCount(1);
    await expect(constraints.section('Unique').emptyNote).toHaveText(
      'No Unique Constraints',
    );

    await foreignKeySection.header(author).click();
    await expect(author).toContainText('Constraint Name: Books_Author_fkey');
    await expect(author).toContainText(/Target:\s*Authors\s*id/);
  });

  test('a unique constraint on several columns gets a name from them', async ({
    schema,
  }) => {
    const unique = constraints.section('Unique');
    await unique.addButton.click();
    await expect(unique.submitButton).toBeDisabled();
    await unique.columns.toggle('Title', 'Pages');
    await expect(unique.naming('Automatically')).toBeChecked();
    await unique.submitButton.click();

    await expect(unique.constraint('Title', 'Pages')).toHaveCount(1);
    await expect(unique.form).toHaveCount(0);
    expect(await uniqueConstraintsOfBooks(schema)).toEqual([
      { name: 'Books_Title_Pages_key', columns: 'Title, Pages' },
    ]);
  });

  test('a unique constraint takes a name of its own, which must be new and not empty', async ({
    schema,
  }) => {
    const unique = constraints.section('Unique');
    await unique.addButton.click();
    await unique.columns.toggle('Title');
    await unique.naming('Manually').check();
    await expect(unique.constraintName).toHaveValue('Books_Title');

    await unique.constraintName.fill('');
    await expect(unique.form).toContainText('Constraint name cannot be empty');
    await unique.constraintName.fill('Books_pkey');
    await expect(unique.form).toContainText(
      'A constraint with that name already exists',
    );
    await expect(unique.submitButton).toBeDisabled();

    await unique.constraintName.fill('One book per title');
    await unique.submitButton.click();
    await expect(unique.constraint('Title')).toHaveCount(1);
    expect(await uniqueConstraintsOfBooks(schema)).toEqual([
      { name: 'One book per title', columns: 'Title' },
    ]);
  });

  test(
    'the form of a unique constraint shows the naming choice without its label "Set Constraint Name"',
    pinsKnownBug('unique-constraint-naming-unlabelled'),
    async () => {
      const unique = constraints.section('Unique');
      await unique.addButton.click();

      await expect(unique.naming('Automatically')).toBeChecked();
      await expect(unique.namingGroup).toHaveCount(0);
      await expect(unique.form).not.toContainText('Set Constraint Name');
    },
  );

  test.fixme('the form of a unique constraint labels the naming choice "Set Constraint Name", with help', async ({
    page,
  }) => {
    const unique = constraints.section('Unique');
    await unique.addButton.click();

    await expect(unique.namingGroup).toBeVisible();
    await unique.namingHelp.hover();
    await expect(tooltip(page)).toContainText(
      'each constraint must have a unique name',
    );
  });

  test('a unique constraint that the records break is refused with the database error', async ({
    page,
    schema,
  }) => {
    const unique = constraints.section('Unique');
    await unique.addButton.click();
    await unique.columns.toggle('Author');
    await unique.submitButton.click();

    await new Toasts(page).expectMessage(
      /Unable to add constraint\.\s*UniqueViolation/,
    );
    await expect(unique.form).toBeVisible();
    await expect(unique.constraints).toHaveCount(0);
    expect(await uniqueConstraintsOfBooks(schema)).toEqual([]);
  });

  test('Cancel closes the form without adding a constraint', async ({
    schema,
  }) => {
    const unique = constraints.section('Unique');
    await unique.addButton.click();
    await unique.columns.toggle('Title');
    await unique.cancelButton.click();

    await expect(unique.form).toHaveCount(0);
    await expect(unique.emptyNote).toBeVisible();
    expect(await uniqueConstraintsOfBooks(schema)).toEqual([]);
  });

  test('deletes a constraint after confirmation', async ({ schema }) => {
    const foreignKeySection = constraints.section('Foreign Keys');
    const publisher = foreignKeySection.constraint('Publisher');
    await foreignKeySection.deleteButton(publisher).click();
    const confirmation = constraints.modal.deleteConfirmation(
      'Books_Publisher_fkey',
    );
    await confirmation.button('Delete Constraint').click();

    await confirmation.expectClosed();
    await expect(publisher).toHaveCount(0);
    await expect(foreignKeySection.constraints).toHaveCount(1);
    expect(await foreignKeys(schema)).not.toContainEqual(
      expect.objectContaining({ name: 'Books_Publisher_fkey' }),
    );
  });

  test('keeps a constraint when the deletion is cancelled', async ({
    schema,
  }) => {
    const foreignKeySection = constraints.section('Foreign Keys');
    const publisher = foreignKeySection.constraint('Publisher');
    await foreignKeySection.deleteButton(publisher).click();
    const confirmation = constraints.modal.deleteConfirmation(
      'Books_Publisher_fkey',
    );
    await confirmation.button('Cancel').click();

    await confirmation.expectClosed();
    await expect(publisher).toHaveCount(1);
    expect(await foreignKeys(schema)).toContainEqual(
      expect.objectContaining({ name: 'Books_Publisher_fkey' }),
    );
  });
});

test('a table without constraints says that it has none', async ({
  page,
  api,
  schema,
}) => {
  await runSqlInSchema(schema, `CREATE TABLE "Notes" ("Text" text)`);
  const constraints = new TableConstraints(page);
  await new TablePage(page).goto(await api.getTable(schema, 'Notes'));
  await constraints.open();

  await expect(constraints.modal.body).toContainText('No Constraints');
  await expect(constraints.section('Primary Keys').root).toHaveCount(0);
});

test('a table whose constraints cannot be loaded says why', async ({
  page,
  library,
}) => {
  await failRpcMethod(
    page,
    'constraints.list',
    'The constraints are unavailable',
  );
  const constraints = new TableConstraints(page);
  await new TablePage(page).goto(library.books);
  await constraints.open();

  await expect(constraints.modal.body).toContainText(
    'Unable to fetch table constraints',
  );
  await expect(constraints.modal.body).toContainText(
    'The constraints are unavailable',
  );
  await expect(constraints.section('Primary Keys').root).toHaveCount(0);
});

test('a primary key and a unique constraint unfold to show their names', async ({
  page,
  schema,
  library,
}) => {
  await runSqlInSchema(
    schema,
    `ALTER TABLE "Books" ADD CONSTRAINT "One book per title" UNIQUE ("Title")`,
  );
  const constraints = new TableConstraints(page);
  await new TablePage(page).goto(library.books);
  await constraints.open();
  const primaryKeys = constraints.section('Primary Keys');
  const unique = constraints.section('Unique');
  const primaryKey = primaryKeys.constraint('id');
  const uniqueTitle = unique.constraint('Title');
  await expect(primaryKey).not.toContainText('Constraint Name');
  await primaryKeys.header(primaryKey).click();
  await unique.header(uniqueTitle).click();

  await expect(primaryKey).toContainText('Constraint Name: Books_pkey');
  await expect(uniqueTitle).toContainText(
    'Constraint Name: One book per title',
  );
});

test.describe('a foreign key on a column that exists', () => {
  let tablePage: TablePage;
  let constraints: TableConstraints;

  test.beforeEach(async ({ page, schema, library }) => {
    tablePage = new TablePage(page);
    constraints = new TableConstraints(page);
    await runSqlInSchema(
      schema,
      `ALTER TABLE "Books" ADD COLUMN "Translator" integer;
       UPDATE "Books" SET "Translator" = 3 WHERE id = 1;`,
    );
    await tablePage.goto(library.books);
    await constraints.open();
  });

  test('turns the cells of the column into links to the target records', async ({
    page,
    schema,
  }) => {
    const foreignKeySection = constraints.section('Foreign Keys');
    await foreignKeySection.addButton.click();
    await chooseColumn(foreignKeySection.referencingColumn, 'Translator');
    await chooseOption(foreignKeySection.targetTable, 'Authors');
    await expect(foreignKeySection.targetColumn).toHaveText('id');
    await expect(foreignKeySection.namingGroup).toBeVisible();
    await foreignKeySection.submitButton.click();

    await expect(foreignKeySection.constraint('Translator')).toHaveCount(1);
    await constraints.modal.close();
    await expect(tablePage.sheet.cell(0, 'Translator')).toHaveText(
      'James Joyce',
    );
    await expect(
      new TableRelationships(page).referencesFromThisTable,
    ).toHaveText([
      'Authors Referenced via Books Author',
      'Publishers Referenced via Books Publisher',
      'Authors Referenced via Books Translator',
    ]);
    expect(await foreignKeys(schema)).toContainEqual({
      name: 'Books_Translator_fkey',
      from: 'Books.Translator',
      to: 'Authors.id',
    });
  });

  test('that the records break shows the database error in the form', async ({
    schema,
  }) => {
    await runSqlInSchema(
      schema,
      `UPDATE "Books" SET "Translator" = 99 WHERE id = 2`,
    );
    const foreignKeySection = constraints.section('Foreign Keys');
    await foreignKeySection.addButton.click();
    await chooseColumn(foreignKeySection.referencingColumn, 'Translator');
    await chooseOption(foreignKeySection.targetTable, 'Authors');
    await foreignKeySection.submitButton.click();

    await expect(foreignKeySection.form).toContainText('ForeignKeyViolation');
    await expect(foreignKeySection.constraints).toHaveCount(2);
    expect(await foreignKeys(schema)).toHaveLength(5);
  });
});
