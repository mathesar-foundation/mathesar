import type { Form, MathesarApi } from '../../support/api/mathesar';
import { FormBuilderPage } from '../../support/ui/pages/form-builder-page';
import { PublicFormPage } from '../../support/ui/pages/public-form-page';
import { type Library, expect, expectSettled, test } from './fixtures';

function defineBookForm(api: MathesarApi, library: Library): Promise<Form> {
  return api.defineForm(library.books, {
    name: 'Suggest a book',
    description: 'Tell us what to read next',
    fields: [
      { column: 'Title', required: true },
      {
        column: 'Author',
        help: 'Pick one of our authors',
        link: { table: library.authors, rule: 'must_pick' },
      },
      { column: 'Genre' },
      { column: 'Published' },
      { column: 'Available' },
    ],
  });
}

test('the form builder with a field of each kind', async ({
  page,
  api,
  library,
}) => {
  const form = await defineBookForm(api, library);
  const formBuilder = new FormBuilderPage(page);
  await formBuilder.goto(library.schema, form.id);
  await expect(formBuilder.fields).toHaveCount(5);
  await expect(formBuilder.inspector.associatedRole).toHaveText('mathesar');
  await expectSettled(page);

  await expect(page).toHaveScreenshot('form-builder.png');
});

test.describe('a visitor without an account', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the public page of a form', async ({ page, api, library }) => {
    const form = await defineBookForm(api, library);
    await api.publishForm(library.schema, form);
    const publicForm = new PublicFormPage(page);
    await publicForm.goto(form.token);
    await expect(publicForm.heading).toHaveText('Suggest a book');
    await expectSettled(page);

    await expect(page).toHaveScreenshot('public-form.png');
  });
});
