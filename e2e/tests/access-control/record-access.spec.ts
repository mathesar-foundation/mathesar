import type { Page } from '@playwright/test';

import { pinsKnownBug } from '../../support/known-bugs';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { RecordPage } from '../../support/ui/pages/record-page';
import { tableUrl } from '../../support/ui/urls';
import { test as base, expect, storedBooks } from './fixtures';
import { grantOnSchema, grantOnTable } from './privileges';

interface RecordAccessFixtures {
  /**
   * Opens the page of the record "Dune" as the collaborator. The role gets
   * these privileges on "Books", as in GRANT, and USAGE on the schema.
   */
  openDuneWith: (privileges: string) => Promise<Page>;
}

const test = base.extend<RecordAccessFixtures>({
  openDuneWith: async ({ books, collaborator, signInAs }, use) => {
    await use(async (privileges) => {
      await grantOnSchema(books.schema, collaborator.role.name, 'USAGE');
      await grantOnTable(books, collaborator.role.name, privileges);
      const page = await signInAs(collaborator.user);
      await new RecordPage(page).goto(books, 1);
      return page;
    });
  },
});

test.describe('what a standard user may do with a record', () => {
  test('shows the database error for a record of a table without SELECT', async ({
    openDuneWith,
  }) => {
    const recordPage = new RecordPage(await openDuneWith('INSERT'));

    await expect(recordPage.errorMessage).toContainText(
      'permission denied for table Books',
    );
  });

  test('shows the record read-only with SELECT only', async ({
    openDuneWith,
  }) => {
    const recordPage = new RecordPage(await openDuneWith('SELECT'));

    await expect(recordPage.field('Title')).toHaveValue('Dune');
    await expect(recordPage.field('Title')).toBeDisabled();
    await expect(recordPage.field('Pages')).toBeDisabled();
    await expect(recordPage.deleteButton).toBeDisabled();
  });

  test('saves a changed field with UPDATE, without a way to delete', async ({
    books,
    openDuneWith,
  }) => {
    const recordPage = new RecordPage(await openDuneWith('SELECT, UPDATE'));
    await expect(recordPage.deleteButton).toBeDisabled();
    await recordPage.field('Title').fill('Dune Messiah');
    await recordPage.saveButton.click();

    await expect(recordPage.saveButton).toHaveCount(0);
    expect(await storedBooks(books)).toContainEqual({
      id: 1,
      Title: 'Dune Messiah',
      Pages: 412,
    });
  });

  test('deletes the record with DELETE, without a way to edit', async ({
    books,
    openDuneWith,
  }) => {
    const page = await openDuneWith('SELECT, DELETE');
    const recordPage = new RecordPage(page);
    await expect(recordPage.field('Title')).toBeDisabled();
    await recordPage.deleteButton.click();
    await recordPage.deleteModal.button('Delete Record').click();

    await expect(page).toHaveURL(tableUrl(books));
    expect((await storedBooks(books)).map(({ Title }) => Title)).toEqual([
      'Emma',
      'Ulysses',
    ]);
  });

  test(
    'keeps every field read-only when the role may update one column only',
    pinsKnownBug('record-page-ignores-column-update'),
    async ({ openDuneWith }) => {
      const recordPage = new RecordPage(
        await openDuneWith('SELECT, UPDATE ("Pages")'),
      );

      await expect(recordPage.field('Pages')).toHaveValue('412');
      await expect(recordPage.field('Pages')).toBeDisabled();
      await expect(recordPage.field('Title')).toBeDisabled();
    },
  );

  test.fixme('saves a field of the one column that the role may update', async ({
    books,
    openDuneWith,
  }) => {
    const recordPage = new RecordPage(
      await openDuneWith('SELECT, UPDATE ("Pages")'),
    );
    await expect(recordPage.field('Title')).toBeDisabled();
    await fillFormattedInput(recordPage.field('Pages'), '500');
    await recordPage.saveButton.click();

    await expect(recordPage.saveButton).toHaveCount(0);
    expect(await storedBooks(books)).toContainEqual({
      id: 1,
      Title: 'Dune',
      Pages: 500,
    });
  });
});
