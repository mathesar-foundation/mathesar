import type { Page } from '@playwright/test';

import type { FormDefinition } from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { recordRpcCalls } from '../../support/rpc-log';
import { chooseOption, openSelect } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { FormBuilderPage } from '../../support/ui/pages/form-builder-page';
import { tableUrl } from '../../support/ui/urls';
import { expect, grantReading, test } from './fixtures';

test.describe('settings of a form in the builder', () => {
  let builder: FormBuilderPage;
  let savedForm: () => Promise<FormDefinition | undefined>;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    savedForm = () => api.findForm(schema, bookForm.id);
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
  });

  test('renames and describes the form on the canvas and in the inspector', async ({
    page,
  }) => {
    const { inspector } = builder;
    await builder.title.fill('Book donations');
    await expect(inspector.name).toHaveValue('Book donations');
    await inspector.description.fill('Tell us about a book');
    await expect(builder.description).toHaveValue('Tell us about a book');

    await inspector.name.fill('Donations');
    await expect(builder.title).toHaveValue('Donations');
    await builder.description.fill('One form per book');
    await expect(inspector.description).toHaveValue('One form per book');
    await expect(builder.heading).toHaveText('Book intake');

    await builder.save();
    expect(await savedForm()).toMatchObject({
      name: 'Donations',
      description: 'One form per book',
    });
    await expect(builder.heading).toHaveText('Donations');
    await expect(page).toHaveTitle('Donations | Mathesar');
    await page.reload();
    await expect(builder.title).toHaveValue('Donations');
    await expect(builder.description).toHaveValue('One form per book');
  });

  test('keeps the caret where text is typed into the name', async ({
    page,
  }) => {
    await builder.title.click();
    await page.keyboard.press('Home');
    await page.keyboard.type('My ');
    await expect(builder.title).toHaveValue('My Book intake');
    await expect(builder.title).toBeFocused();
    await expect(builder.title).toHaveJSProperty('selectionStart', 3);

    await builder.inspector.name.click();
    await page.keyboard.press('Home');
    await page.keyboard.type('Oh ');
    await expect(builder.inspector.name).toHaveValue('Oh My Book intake');
    await expect(builder.inspector.name).toBeFocused();
    await expect(builder.inspector.name).toHaveJSProperty('selectionStart', 3);
  });

  test('grows the description with its text', async () => {
    const emptyHeight = await builder.descriptionHeight();
    await builder.description.fill('One\nTwo\nThree\nFour');

    await expect
      .poll(() => builder.descriptionHeight())
      .toBeGreaterThan(emptyHeight);
  });

  test('names the form after its table when the name is left empty', async () => {
    await builder.title.fill('');
    await expect(builder.title).toHaveValue('');
    await builder.description.click();

    await expect(builder.title).toHaveValue('Books Form');
    await expect(builder.inspector.name).toHaveValue('Books Form');
  });

  test('links to the base table', async ({ page, library }) => {
    await expect(builder.inspector.tableLink).toHaveText('Books');
    await builder.inspector.tableLink.click();
    await expect(page).toHaveURL(tableUrl(library.books));
  });

  test('sets the label of the submit button', async () => {
    const { inspector } = builder;
    await expect(inspector.buttonLabel).toHaveAttribute(
      'placeholder',
      'Submit',
    );
    await inspector.buttonLabel.fill('Send it');
    await expect(builder.submitButton('Send it')).toBeVisible();
    await expect(builder.submitButton('Submit')).toBeHidden();

    await builder.save();
    expect(await savedForm()).toMatchObject({ buttonLabel: 'Send it' });

    await inspector.buttonLabel.fill('');
    await expect(builder.submitButton('Submit')).toBeVisible();
  });

  test('sets what the visitor sees after a submission', async ({ page }) => {
    const { inspector } = builder;
    await expect(inspector.confirmationMessage).toHaveAttribute(
      'placeholder',
      'Thank you for submitting the form!',
    );
    await expect(inspector.redirectToggle).not.toBeChecked();
    await expect(inspector.redirectUrl).toBeHidden();

    await inspector.confirmationMessage.fill('Got it, thanks');
    await inspector.redirectToggle.check();
    await inspector.redirectUrl.fill('example.org/thanks');
    await builder.save();
    expect(await savedForm()).toMatchObject({
      confirmationMessage: 'Got it, thanks',
      redirectUrl: 'example.org/thanks',
    });

    await page.reload();
    await expect(inspector.confirmationMessage).toHaveValue('Got it, thanks');
    await expect(inspector.redirectToggle).toBeChecked();
    await expect(inspector.redirectUrl).toHaveValue('example.org/thanks');
  });

  test('stops redirecting when the redirect is switched off', async ({
    api,
    schema,
    library,
  }) => {
    const { inspector } = builder;
    const form = await api.defineForm(library.books, {
      name: 'Redirecting',
      fields: [{ column: 'Title' }],
      redirectUrl: 'example.org/thanks',
    });
    await builder.goto(schema, form.id);
    await expect(inspector.redirectUrl).toHaveValue('example.org/thanks');

    await inspector.redirectToggle.uncheck();
    await expect(inspector.redirectUrl).toBeHidden();
    await builder.save();
    expect(await api.findForm(schema, form.id)).toMatchObject({
      redirectUrl: null,
    });
  });

  test('Enter in a text field neither saves nor reloads the builder', async ({
    page,
  }) => {
    await builder.title.fill('Unsaved name');
    const calls = recordRpcCalls(page);
    await builder.title.press('Enter');
    await builder.inspector.name.press('Enter');
    await builder.inspector.buttonLabel.press('Enter');
    await (await builder.field('Pages')).label.press('Enter');

    await expect(builder.title).toHaveValue('Unsaved name');
    await expect(builder.saveButton).toBeEnabled();
    expect(calls.filter((method) => method.startsWith('forms.'))).toEqual([]);
  });
});

test.describe('associated role of a form', () => {
  test('chooses the role that inserts the submitted records', async ({
    page,
    api,
    database,
    schema,
    bookForm,
    collaborator,
  }) => {
    const builder = new FormBuilderPage(page);
    const { inspector } = builder;
    await builder.goto(schema, bookForm.id);
    await expect(inspector.associatedRole).toHaveText(
      await api.currentRoleName(database),
    );
    await inspector.associatedRoleHelp.hover();
    await expect(builder.tooltip).toHaveText(
      'This PostgreSQL role will be used to insert the form data into the base table.',
    );

    await chooseOption(inspector.associatedRole, collaborator.role.name);
    await builder.save();
    expect(await api.findForm(schema, bookForm.id)).toMatchObject({
      associatedRoleId: collaborator.role.id,
    });
    await page.reload();
    await expect(inspector.associatedRole).toHaveText(collaborator.role.name);
  });
});

test.describe('associated role for a standard user', () => {
  let userPage: Page;
  let builder: FormBuilderPage;

  test.beforeEach(
    async ({
      database,
      schema,
      library,
      bookForm,
      collaborator,
      groupRole,
      signInAs,
    }) => {
      await grantReading(library, collaborator.role.name);
      await runSql(
        database.name,
        `GRANT ${quoteIdentifier(groupRole.name)} TO ${quoteIdentifier(collaborator.role.name)}`,
      );
      userPage = await signInAs(collaborator.user);
      builder = new FormBuilderPage(userPage);
      await builder.goto(schema, bookForm.id);
    },
  );

  test('offers the role of the user and the roles it is a member of', async ({
    api,
    database,
    schema,
    bookForm,
    collaborator,
    groupRole,
  }) => {
    const { inspector } = builder;
    const adminRole = await api.currentRoleName(database);
    await expect(inspector.associatedRole).toHaveText(adminRole);
    await openSelect(inspector.associatedRole);
    await inspector.expectRoleAllowed(adminRole, false);
    await inspector.roleOptionHelp(adminRole).hover();
    await expect(builder.tooltip).toHaveText(
      'You do not have access to this role',
    );
    await inspector.expectRoleAllowed(collaborator.role.name);
    await inspector.expectRoleAllowed(groupRole.name);

    await inspector.roleOption(groupRole.name).click();
    await builder.save();
    expect(await api.findForm(schema, bookForm.id)).toMatchObject({
      associatedRoleId: groupRole.id,
    });
  });

  test('refuses to save while the form keeps a role that the user does not hold', async ({
    api,
    schema,
    bookForm,
  }) => {
    await builder.title.fill('Book donations');
    await builder.saveButton.click();

    await new Toasts(userPage).expectMessage(
      'AssertionError: Insufficient privileges for selected associated_role',
    );
    await expect(builder.saveButton).toBeEnabled();
    expect((await api.findForm(schema, bookForm.id))?.name).toBe('Book intake');
  });
});
