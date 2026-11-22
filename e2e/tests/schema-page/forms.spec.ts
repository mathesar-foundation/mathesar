import type { Form } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import {
  newItemHighlight,
  skipHighlightDelay,
} from '../../support/ui/components/new-item-highlight';
import { chooseOption } from '../../support/ui/components/select';
import { Toasts } from '../../support/ui/components/toast';
import { schemaUrl } from '../../support/ui/urls';
import { expect, test } from './shop';

// tests/forms/create-form.spec.ts covers the modal that creates a form.
test.describe('forms of a schema', () => {
  test('says that the schema has no forms', async ({ shop, schemaPage }) => {
    await schemaPage.goto(shop.products.schema);
    await expect(schemaPage.forms.items).toHaveCount(0);
    await expect(schemaPage.forms.section).toContainText('No Forms');
  });

  test('highlights a form that was just created', async ({
    page,
    api,
    shop,
    schemaPage,
  }) => {
    await api.defineForm(shop.products, { name: 'Restock', fields: [] });
    await page.clock.install();
    await schemaPage.goto(shop.products.schema);
    await expect(schemaPage.forms.item('Restock')).toBeVisible();
    await skipHighlightDelay(page);

    await schemaPage.newFormButton.click();
    await chooseOption(schemaPage.newFormModal.baseTable, 'Orders');
    await schemaPage.newFormModal.button('Save').click();
    await expect(newItemHighlight(page)).toBeVisible();
  });

  test.describe('with saved forms', () => {
    let order: Form;

    test.beforeEach(async ({ api, shop, schemaPage }) => {
      await api.defineForm(shop.products, {
        name: 'Restock',
        description: 'For the warehouse',
        fields: [],
      });
      order = await api.defineForm(shop.orders, { name: 'Order', fields: [] });
      await schemaPage.goto(shop.products.schema);
    });

    test('lists the forms by name with their tables', async ({
      schema,
      schemaPage,
    }) => {
      const { forms } = schemaPage;
      await expect(forms.items).toHaveText([
        'Order For Orders',
        'Restock For Products',
      ]);
      await expect(forms.link('Order')).toHaveAttribute(
        'href',
        `${schemaUrl(schema)}forms/${order.id}/`,
      );
    });

    test('renames a form and changes its description', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { forms } = schemaPage;
      const renameModal = schemaPage.renameFormModal('Restock');
      await forms.chooseAction('Restock', 'Rename Form');
      await expect(renameModal.baseTable).toBeDisabled();
      await expect(renameModal.baseTable).toHaveText('Products');
      await expect(renameModal.name).toHaveValue('Restock');
      await expect(renameModal.description).toHaveValue('For the warehouse');
      await renameModal.name.fill('Deliveries');
      await renameModal.description.fill('What arrived');
      await renameModal.button('Save').click();

      await renameModal.expectClosed();
      await expect(forms.items).toHaveText([
        'Deliveries For Products',
        'Order For Orders',
      ]);
      expect(await api.listForms(schema)).toContainEqual(
        expect.objectContaining({
          name: 'Deliveries',
          description: 'What arrived',
        }),
      );
    });

    test(
      'saves a form without a name',
      pinsKnownBug('form-renamed-to-nothing'),
      async ({ api, schema, schemaPage }) => {
        const { forms } = schemaPage;
        const renameModal = schemaPage.renameFormModal('Restock');
        await forms.chooseAction('Restock', 'Rename Form');
        await expect(renameModal.name).toHaveAttribute(
          'placeholder',
          'Products Form',
        );
        await renameModal.name.fill('');
        await renameModal.button('Save').click();

        await renameModal.expectClosed();
        await expect(forms.items).toHaveText([
          'For Products',
          'Order For Orders',
        ]);
        expect(await api.listForms(schema)).toContainEqual(
          expect.objectContaining({ name: '' }),
        );
      },
    );

    test.fixme('names a form after its table when its name is cleared', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { forms } = schemaPage;
      const renameModal = schemaPage.renameFormModal('Restock');
      await forms.chooseAction('Restock', 'Rename Form');
      await renameModal.name.fill('');
      await renameModal.button('Save').click();

      await renameModal.expectClosed();
      await expect(forms.item('Products Form')).toBeVisible();
      expect(await api.listForms(schema)).toContainEqual(
        expect.objectContaining({ name: 'Products Form' }),
      );
    });

    test('keeps the name of the form when the rename is cancelled', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const renameModal = schemaPage.renameFormModal('Restock');
      await schemaPage.forms.chooseAction('Restock', 'Rename Form');
      await renameModal.name.fill('Deliveries');
      await renameModal.button('Cancel').click();

      await renameModal.expectClosed();
      await expect(schemaPage.forms.item('Restock')).toBeVisible();
      expect(await api.listForms(schema)).toContainEqual(
        expect.objectContaining({ name: 'Restock' }),
      );
    });

    test('deletes a form after confirmation', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const { forms } = schemaPage;
      const deleteModal = schemaPage.deleteModal('Form', 'Restock');
      await forms.chooseAction('Restock', 'Delete Form');
      await expect(deleteModal.body).toHaveText(
        'Are you sure you want to proceed?',
      );
      await deleteModal.button('Delete Form').click();

      await deleteModal.expectClosed();
      await expect(forms.items).toHaveText(['Order For Orders']);
      await expect
        .poll(async () => (await api.listForms(schema)).map(({ name }) => name))
        .toEqual(['Order']);
    });

    test('keeps the form when the deletion is cancelled', async ({
      api,
      schema,
      schemaPage,
    }) => {
      const deleteModal = schemaPage.deleteModal('Form', 'Restock');
      await schemaPage.forms.chooseAction('Restock', 'Delete Form');
      await deleteModal.button('Cancel').click();

      await deleteModal.expectClosed();
      await expect(schemaPage.forms.item('Restock')).toBeVisible();
      expect(await api.listForms(schema)).toHaveLength(2);
    });
  });

  test.describe('of a form that was deleted elsewhere', () => {
    test.beforeEach(async ({ api, shop, schema, schemaPage }) => {
      const restock = await api.defineForm(shop.products, {
        name: 'Restock',
        fields: [],
      });
      await schemaPage.goto(schema);
      await expect(schemaPage.forms.item('Restock')).toBeVisible();
      await api.deleteForm(schema, restock);
    });

    test.describe('today', () => {
      test.use({ allowedBrowserErrors: /Form matching query does not exist/ });

      test(
        'keeps a deleted form in the list without a message and throws the error uncaught',
        pinsKnownBug('form-gone-error-uncaught'),
        async ({ page, schemaPage }) => {
          const uncaughtError = page.waitForEvent('pageerror');
          await schemaPage.forms.chooseAction('Restock', 'Delete Form');
          await schemaPage
            .deleteModal('Form', 'Restock')
            .button('Delete Form')
            .click();

          expect((await uncaughtError).message).toContain(
            'Form matching query does not exist',
          );
          await expect(schemaPage.forms.item('Restock')).toBeVisible();
          await expect(new Toasts(page).items).toHaveCount(0);
        },
      );

      test(
        'keeps the rename form open without a message and throws the error uncaught',
        pinsKnownBug('form-gone-error-uncaught'),
        async ({ page, schemaPage }) => {
          const renameModal = schemaPage.renameFormModal('Restock');
          const uncaughtError = page.waitForEvent('pageerror');
          await schemaPage.forms.chooseAction('Restock', 'Rename Form');
          await renameModal.name.fill('Deliveries');
          await renameModal.button('Save').click();

          expect((await uncaughtError).message).toContain(
            'Form matching query does not exist',
          );
          await renameModal.expectOpen();
          await expect(new Toasts(page).items).toHaveCount(0);
        },
      );
    });

    test.fixme('says that a deleted form could not be deleted', async ({
      page,
      schemaPage,
    }) => {
      await schemaPage.forms.chooseAction('Restock', 'Delete Form');
      await schemaPage
        .deleteModal('Form', 'Restock')
        .button('Delete Form')
        .click();

      await new Toasts(page).expectMessage(
        /^Unable to delete Form\. .*Form matching query does not exist/,
      );
    });

    test.fixme('says that a deleted form could not be renamed', async ({
      page,
      schemaPage,
    }) => {
      const renameModal = schemaPage.renameFormModal('Restock');
      await schemaPage.forms.chooseAction('Restock', 'Rename Form');
      await renameModal.name.fill('Deliveries');
      await renameModal.button('Save').click();

      await new Toasts(page).expectMessage(
        /Form matching query does not exist/,
      );
    });
  });

  test('links a shared form to its public page', async ({
    page,
    api,
    shop,
    schema,
    schemaPage,
  }) => {
    const shared = await api.defineForm(shop.products, {
      name: 'Restock',
      fields: [],
    });
    await api.defineForm(shop.orders, { name: 'Order', fields: [] });
    await api.publishForm(schema, shared);
    await schemaPage.goto(schema);
    await expect(schemaPage.publicFormLink('Order')).toHaveCount(0);
    await expect(schemaPage.publicFormLink('Restock')).toHaveAttribute(
      'href',
      new URL(`/shares/forms/${shared.token}/`, page.url()).href,
    );

    await schemaPage.publicFormLink('Restock').hover();
    await expect(schemaPage.tooltip).toHaveText(
      'This form accepts responses via a publicly accessible link.',
    );
  });
});
