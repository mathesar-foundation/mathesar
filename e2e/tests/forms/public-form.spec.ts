import { runSqlInSchema } from '../../support/api/mathesar';
import { env } from '../../support/env';
import { holdRpcCalls } from '../../support/held-requests';
import { pinsKnownBug } from '../../support/known-bugs';
import { recordRpcCalls } from '../../support/rpc-log';
import { pauseClock } from '../../support/ui/clock';
import { fillFormattedInput } from '../../support/ui/components/formatted-input';
import { chooseOption } from '../../support/ui/components/select';
import {
  PublicFormPage,
  publicFormUrl,
} from '../../support/ui/pages/public-form-page';
import { expect, grantReading, storedBooks, test } from './fixtures';

test.describe('a published form as a visitor fills it', () => {
  let publicForm: PublicFormPage;

  test.beforeEach(async ({ api, schema, bookForm, visitor }) => {
    await api.publishForm(schema, bookForm);
    publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);
  });

  test('enables Submit only while every required field has a value', async () => {
    const title = publicForm.field('Title');
    await expect(publicForm.requiredMark('Title')).toBeVisible();
    await expect(publicForm.requiredMark('Pages')).toBeHidden();
    await expect(publicForm.submitButton()).toBeDisabled();
    await expect(publicForm.emptyValueError('Title')).toBeHidden();

    await title.fill('Dune');
    await expect(publicForm.submitButton()).toBeEnabled();
    await title.fill('');
    await expect(publicForm.emptyValueError('Title')).toBeVisible();
    await expect(publicForm.submitButton()).toBeDisabled();
  });

  test('focuses the input of a field when its label is clicked', async () => {
    await publicForm.label('Pages').click();
    await expect(publicForm.field('Pages')).toBeFocused();
    await publicForm.label('Author').click();
    await expect(publicForm.field('Author')).toBeFocused();
  });

  test('submits the value of every field and thanks the visitor', async ({
    visitor,
    library,
    bookForm,
  }) => {
    await publicForm.field('Title').fill('Dune');
    await fillFormattedInput(publicForm.field('Pages'), '412');
    await fillFormattedInput(publicForm.field('Price'), '9.99');
    await chooseOption(publicForm.field('In Stock'), 'true');
    await fillFormattedInput(publicForm.field('Published'), '2024-03-15');
    await publicForm.pickRecord('Author', 'Stanislaw Lem');
    await publicForm.field('Notes').fill('Signed copy');
    await publicForm.submitButton().click();

    await expect(publicForm.form).toContainText(
      'Thank you for submitting the form!',
    );
    await expect(publicForm.submitAnotherButton).toBeVisible();
    await expect(publicForm.field('Title')).toBeHidden();
    await expect(visitor).toHaveURL(publicFormUrl(bookForm.token));
    expect(await storedBooks(library)).toEqual([
      {
        title: 'Dune',
        pages: 412,
        price: 9.99,
        inStock: true,
        published: '2024-03-15',
        author: 'Stanislaw Lem',
        notes: 'Signed copy',
      },
    ]);
  });

  test('submits on Enter in a text input without loading another page', async ({
    visitor,
    library,
    bookForm,
  }) => {
    await publicForm.field('Title').fill('Dune');
    await publicForm.field('Title').press('Enter');

    await expect(publicForm.submitAnotherButton).toBeVisible();
    await expect(visitor).toHaveURL(publicFormUrl(bookForm.token));
    expect(await storedBooks(library)).toMatchObject([{ title: 'Dune' }]);
  });

  test('starts an empty response after "Submit another response"', async ({
    library,
  }) => {
    await publicForm.field('Title').fill('Dune');
    await fillFormattedInput(publicForm.field('Pages'), '412');
    await publicForm.submitButton().click();
    await publicForm.submitAnotherButton.click();

    await expect(publicForm.field('Title')).toHaveValue('');
    await expect(publicForm.field('Pages')).toHaveValue('');
    await expect(publicForm.submitButton()).toBeDisabled();
    await publicForm.field('Title').fill('Emma');
    await publicForm.submitButton().click();
    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedBooks(library)).toMatchObject([
      { title: 'Dune', pages: 412 },
      { title: 'Emma', pages: null },
    ]);
  });

  test('empties every field on "Clear form"', async ({ library }) => {
    await publicForm.field('Title').fill('Dune');
    await fillFormattedInput(publicForm.field('Pages'), '412');
    await chooseOption(publicForm.field('In Stock'), 'false');
    await publicForm.pickRecord('Author', 'Octavia Butler');
    await publicForm.clearButton.click();

    await expect(publicForm.field('Title')).toHaveValue('');
    await expect(publicForm.field('Pages')).toHaveValue('');
    await expect(publicForm.field('In Stock')).toHaveText('');
    await expect(publicForm.field('Author')).toHaveText('');
    await expect(publicForm.emptyValueError('Title')).toBeHidden();
    await expect(publicForm.submitButton()).toBeDisabled();
    expect(await storedBooks(library)).toEqual([]);
  });

  test('groups the digits of a number and ignores letters', async ({
    library,
  }) => {
    const pages = publicForm.field('Pages');
    await pages.pressSequentially('12a34');
    await expect(pages).toHaveValue('1,234');
    // toHaveJSProperty crashes Firefox on this input once it was typed into.
    await expect
      .poll(() =>
        pages.evaluate((input: HTMLInputElement) => input.selectionStart),
      )
      .toBe(5);

    await publicForm.field('Title').fill('Dune');
    await publicForm.submitButton().click();
    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedBooks(library)).toMatchObject([{ pages: 1234 }]);
  });

  test('fills a date from the picker, which follows a typed date', async ({
    library,
  }) => {
    const published = publicForm.field('Published');
    await published.click();
    await expect(publicForm.datePicker).toBeVisible();
    await fillFormattedInput(published, '2024-03-15');
    await publicForm.day(20).click();

    await expect(published).toHaveValue('03/20/2024');
    await expect(publicForm.datePicker).toBeHidden();
    await publicForm.field('Title').fill('Dune');
    await publicForm.submitButton().click();
    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedBooks(library)).toMatchObject([
      { published: '2024-03-20' },
    ]);
  });

  test('disables the form while the submission is on its way', async ({
    visitor,
    library,
  }) => {
    const release = await holdRpcCalls(visitor, 'forms.submit');
    await publicForm.field('Title').fill('Dune');
    await publicForm.submitButton().click();

    await expect(publicForm.field('Title')).toBeDisabled();
    await expect(publicForm.clearButton).toBeDisabled();
    await expect(publicForm.submitButton()).toBeDisabled();
    release();
    await expect(publicForm.submitAnotherButton).toBeVisible();
    expect(await storedBooks(library)).toMatchObject([{ title: 'Dune' }]);
  });

  test('refuses a submission once the link has been disabled', async ({
    api,
    schema,
    library,
    bookForm,
  }) => {
    await publicForm.field('Title').fill('Dune');
    await api.unpublishForm(schema, bookForm);
    await publicForm.submitButton().click();

    await expect(publicForm.submissionError).toBeVisible();
    await publicForm.errorDetailsToggle.click();
    await expect(publicForm.form).toContainText(
      'AssertionError: This form does not accept submissions',
    );
    await expect(publicForm.field('Title')).toHaveValue('Dune');
    expect(await storedBooks(library)).toEqual([]);
  });
});

test.describe('a published form with its own settings', () => {
  test('shows its name, description, labels and help texts', async ({
    api,
    schema,
    library,
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    const form = await api.defineForm(library.books, {
      name: ' Donations ',
      description: 'Tell us about a book',
      fields: [
        { column: 'Title', help: 'As printed on the cover' },
        { column: 'Pages', required: true },
        { column: 'Notes', label: 'Anything else?', large: true },
      ],
    });
    await api.publishForm(schema, form);
    await publicForm.goto(form.token);

    await expect(visitor).toHaveTitle('Donations | Mathesar');
    await expect(publicForm.heading).toHaveText('Donations');
    await expect(publicForm.description).toHaveText('Tell us about a book');
    await expect(publicForm.helpText('Title')).toHaveText(
      'As printed on the cover',
    );
    await expect(publicForm.requiredMark('Title')).toBeVisible();
    await expect(publicForm.requiredMark('Pages')).toBeVisible();
    await expect(publicForm.requiredMark('Anything else?')).toBeHidden();
    await expect(publicForm.field('Anything else?')).toHaveJSProperty(
      'tagName',
      'TEXTAREA',
    );
    await expect(publicForm.clearButton).toBeVisible();
    await expect(publicForm.brandingLink).toHaveAttribute(
      'href',
      'https://mathesar.org',
    );
  });

  test('uses the button label and the confirmation message of the form', async ({
    api,
    schema,
    library,
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    const form = await api.defineForm(library.books, {
      name: 'Donations',
      fields: [{ column: 'Title' }],
      buttonLabel: 'Send it',
      confirmationMessage: 'Got it, thanks',
    });
    await api.publishForm(schema, form);
    await publicForm.goto(form.token);
    await publicForm.field('Title').fill('Dune');
    await publicForm.submitButton('Send it').click();

    await expect(publicForm.form).toContainText('Got it, thanks');
    await expect(publicForm.form).not.toContainText('Thank you');
    await expect(publicForm.submitAnotherButton).toBeVisible();
  });

  test('sends the visitor to the redirect address three seconds after a submission', async ({
    api,
    schema,
    library,
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    const form = await api.defineForm(library.books, {
      name: 'Donations',
      fields: [{ column: 'Title' }],
      redirectUrl: 'example.org/thanks',
    });
    await api.publishForm(schema, form);
    await visitor.route('http://example.org/thanks', (route) =>
      route.fulfill({ body: 'Thanks' }),
    );
    await visitor.clock.install();
    await publicForm.goto(form.token);
    await publicForm.field('Title').fill('Dune');
    await publicForm.recordNavigations();
    await pauseClock(visitor);
    await publicForm.submitButton().click();

    await expect(publicForm.redirectLink).toHaveAttribute(
      'href',
      'http://example.org/thanks',
    );
    await expect(publicForm.form).toContainText(
      "Click on the link above if you're not redirected automatically.",
    );
    await expect(publicForm.submitAnotherButton).toBeHidden();
    await visitor.clock.runFor(2999);
    expect(await publicForm.recordedNavigations()).toEqual([]);
    await visitor.clock.runFor(1);
    await expect(visitor).toHaveURL('http://example.org/thanks');
    expect(await storedBooks(library)).toMatchObject([{ title: 'Dune' }]);
  });

  test('shows why a submission failed and keeps the values', async ({
    api,
    schema,
    library,
    collaborator,
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    await grantReading(library, collaborator.role.name);
    const form = await api.defineForm(library.books, {
      name: 'Donations',
      fields: [{ column: 'Title' }],
      associatedRole: collaborator.role,
    });
    await api.publishForm(schema, form);
    await publicForm.goto(form.token);
    await publicForm.field('Title').fill('Dune');
    await publicForm.submitButton().click();

    await expect(publicForm.submissionError).toBeVisible();
    await expect(publicForm.form).not.toContainText('InsufficientPrivilege');
    await publicForm.errorDetailsToggle.click();
    await expect(publicForm.form).toContainText(
      'InsufficientPrivilege: permission denied for table Books',
    );
    await expect(publicForm.field('Title')).toHaveValue('Dune');
    expect(await storedBooks(library)).toEqual([]);
  });

  test('warns the visitor of a field whose column was dropped', async ({
    api,
    schema,
    bookForm,
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    await runSqlInSchema(schema, 'ALTER TABLE "Books" DROP COLUMN "Notes"');
    await api.publishForm(schema, bookForm);
    await publicForm.goto(bookForm.token);

    await expect(publicForm.form).toContainText(
      'This form is misconfigured and may not work as expected. Please contact your admin or the site owner.',
    );
    await expect(publicForm.form).toContainText(
      'Error: The column associated with this field is no longer present.',
    );
    await expect(publicForm.field('Title')).toBeVisible();
  });
});

test('loads a published form with one request per source', async ({
  api,
  schema,
  bookForm,
  visitor,
}) => {
  const publicForm = new PublicFormPage(visitor);
  await api.publishForm(schema, bookForm);
  const calls = recordRpcCalls(visitor);
  await publicForm.goto(bookForm.token);

  await expect(publicForm.heading).toHaveText('Book intake');
  await expect(publicForm.field('Notes')).toBeVisible();
  expect([...calls].sort()).toEqual(['forms.get', 'forms.get_source_info']);
});

test('shows a published form in English to a visitor whose language cookie is French', async ({
  api,
  schema,
  bookForm,
  visitor,
}) => {
  const publicForm = new PublicFormPage(visitor);
  await api.publishForm(schema, bookForm);
  await visitor
    .context()
    .addCookies([{ name: 'display_language', value: 'fr', url: env.baseUrl }]);
  await publicForm.goto(bookForm.token);

  await expect(publicForm.heading).toHaveText('Book intake');
  await expect(publicForm.submitButton('Submit')).toBeVisible();
  await expect(publicForm.clearButton).toBeVisible();
});

test('records a signed-in submitter in the column that tracks the editing user', async ({
  page,
  api,
  schema,
  library,
  visitor,
}) => {
  await runSqlInSchema(
    schema,
    'ALTER TABLE "Books" ADD COLUMN "Entered by" integer',
  );
  const books = await api.getTable(schema, library.books.name);
  await api.makeUserColumn(books, 'Entered by');
  await api.trackEditingUserIn(books, 'Entered by');
  const form = await api.defineForm(books, {
    name: 'Book intake',
    fields: [{ column: 'Title' }],
  });
  await api.publishForm(schema, form);
  const admin = await api.findUser('admin');

  const asAdmin = new PublicFormPage(page);
  await asAdmin.goto(form.token);
  await asAdmin.field('Title').fill('Dune');
  await asAdmin.submitButton().click();
  await expect(asAdmin.submitAnotherButton).toBeVisible();
  const asVisitor = new PublicFormPage(visitor);
  await asVisitor.goto(form.token);
  await asVisitor.field('Title').fill('Emma');
  await asVisitor.submitButton().click();
  await expect(asVisitor.submitAnotherButton).toBeVisible();

  expect(
    await runSqlInSchema(
      schema,
      'SELECT "Title" AS title, "Entered by" AS "enteredBy" FROM "Books" ORDER BY id',
    ),
  ).toEqual([
    { title: 'Dune', enteredBy: admin?.id },
    { title: 'Emma', enteredBy: null },
  ]);
});

test.describe('a link that leads to no published form', () => {
  test('shows the errors of the server to a visitor of a form that is not published', async ({
    bookForm,
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);

    await expect(publicForm.errorHeading).toBeVisible();
    await expect(publicForm.main).toContainText(
      'AssertionError: Insufficient permission to get the form',
    );
    await expect(publicForm.main).toContainText(
      'AssertionError: Insufficient permission to get form source info',
    );
    await expect(publicForm.form).toHaveCount(0);
  });

  test('shows the error of the server for a malformed link', async ({
    visitor,
  }) => {
    const publicForm = new PublicFormPage(visitor);
    await publicForm.goto('not-a-token');

    await expect(publicForm.errorHeading).toBeVisible();
    await expect(publicForm.main).toContainText(
      "ValidationError: ['“not-a-token” is not a valid UUID.']",
    );
  });

  test('tells a signed-in user that the form is not shared publicly', async ({
    page,
    bookForm,
  }) => {
    const publicForm = new PublicFormPage(page);
    await publicForm.goto(bookForm.token);

    await expect(publicForm.main).toContainText(
      'This form is not publicly shared.',
    );
    await expect(publicForm.appHeader).toBeVisible();
    await expect(publicForm.form).toHaveCount(0);
  });
});

test.describe('a required boolean field', () => {
  let publicForm: PublicFormPage;

  test.beforeEach(async ({ api, schema, library, visitor }) => {
    const form = await api.defineForm(library.books, {
      name: 'Stock check',
      fields: [{ column: 'Title' }, { column: 'In Stock', required: true }],
    });
    await api.publishForm(schema, form);
    publicForm = new PublicFormPage(visitor);
    await publicForm.goto(form.token);
  });

  test(
    'says that the value cannot be empty before the visitor touched the field',
    pinsKnownBug('form-required-boolean-error-on-load'),
    async () => {
      await expect(publicForm.emptyValueError('In Stock')).toBeVisible();
      await expect(publicForm.emptyValueError('Title')).toBeHidden();
    },
  );

  test.fixme('shows no error before the visitor touched the field', async () => {
    await expect(publicForm.field('In Stock')).toBeVisible();
    await expect(publicForm.emptyValueError('In Stock')).toBeHidden();
  });
});
