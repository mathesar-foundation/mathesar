import type { Page } from '@playwright/test';

import type { FormDefinition } from '../../support/api/mathesar';
import { pinsKnownBug } from '../../support/known-bugs';
import { failRpcMethod } from '../../support/rpc-failures';
import { readClipboardText } from '../../support/ui/clipboard';
import { Toasts } from '../../support/ui/components/toast';
import { expectStaysOpen } from '../../support/ui/components/transitions';
import { FormBuilderPage } from '../../support/ui/pages/form-builder-page';
import {
  PublicFormPage,
  publicFormUrl,
} from '../../support/ui/pages/public-form-page';
import { expect, test } from './fixtures';

/** The public link as the Share dropdown shows it, with the origin of the app. */
function shareLink(page: Page, token: string): string {
  return new URL(publicFormUrl(token), page.url()).href;
}

test.describe('sharing a form without a public link', () => {
  let builder: FormBuilderPage;
  let savedForm: () => Promise<FormDefinition | undefined>;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    savedForm = () => api.findForm(schema, bookForm.id);
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
  });

  test('creates a public link that a visitor can open', async ({
    page,
    bookForm,
    visitor,
  }) => {
    const { share } = builder;
    await builder.shareButton.click();
    await expect(share.root).toContainText(
      'Accept responses via a publicly-accessible link.',
    );
    await share.createLinkButton.click();

    await expect(share.root).toContainText(
      'This form accepts responses via a publicly accessible link.',
    );
    await expect(share.link).toHaveValue(shareLink(page, bookForm.token));
    await expect(builder.shareButton).toHaveText('Shared via link');
    expect(await savedForm()).toMatchObject({
      isPublic: true,
      token: bookForm.token,
    });
    const publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);
    await expect(publicForm.heading).toHaveText('Book intake');
  });

  test('asks for the changes to be saved before a link can be created', async () => {
    const { share } = builder;
    await builder.title.fill('Book donations');
    await builder.shareButton.click();
    await expect(share.unsavedChangesWarning).toBeVisible();
    await expect(share.createLinkButton).toBeDisabled();

    await builder.save();
    await builder.shareButton.click();
    await expect(share.unsavedChangesWarning).toBeHidden();
    await expect(share.createLinkButton).toBeEnabled();
  });

  test('closes on a second click of Share and on a click outside, but not on Escape', async ({
    page,
  }) => {
    const { share } = builder;
    await builder.shareButton.click();
    await page.keyboard.press('Escape');
    await expectStaysOpen(share.root);
    await builder.shareButton.click();
    await expect(share.root).toBeHidden();

    await builder.shareButton.click();
    await expect(share.root).toBeVisible();
    await builder.clickEmptyCanvas();
    await expect(share.root).toBeHidden();
  });

  test(
    'shows an empty toast when the link cannot be created',
    pinsKnownBug('form-share-error-toast-empty'),
    async ({ page }) => {
      await failRpcMethod(page, 'forms.set_publish_public', 'Sharing is off');
      await builder.shareButton.click();
      await builder.share.createLinkButton.click();

      await expect(new Toasts(page).items).toHaveText(['']);
      await expect(builder.share.createLinkButton).toBeVisible();
      expect((await savedForm())?.isPublic).toBe(false);
    },
  );

  test.fixme('says why the link cannot be created', async ({ page }) => {
    await failRpcMethod(page, 'forms.set_publish_public', 'Sharing is off');
    await builder.shareButton.click();
    await builder.share.createLinkButton.click();

    await new Toasts(page).expectMessage('Sharing is off');
  });
});

test.describe('sharing a form with a public link', () => {
  let builder: FormBuilderPage;
  let savedForm: () => Promise<FormDefinition | undefined>;

  test.beforeEach(async ({ page, api, schema, bookForm }) => {
    await api.publishForm(schema, bookForm);
    savedForm = () => api.findForm(schema, bookForm.id);
    builder = new FormBuilderPage(page);
    await builder.goto(schema, bookForm.id);
  });

  test('copies the link and says so', async ({ page, bookForm }) => {
    const { share } = builder;
    await builder.shareButton.click();
    await share.copyButton.click();

    await new Toasts(page).expectMessage('Link copied');
    await expect(share.link).toBeFocused();
    expect(await readClipboardText(page)).toBe(shareLink(page, bookForm.token));
  });

  test('opens the public page in a new tab', async ({ page, bookForm }) => {
    await builder.shareButton.click();
    const newTab = page.waitForEvent('popup');
    await builder.share.openLink.click();

    const publicForm = new PublicFormPage(await newTab);
    await expect(publicForm.heading).toHaveText('Book intake');
    expect((await newTab).url()).toBe(shareLink(page, bookForm.token));
  });

  test('regenerates the link after confirmation, which ends the old link', async ({
    page,
    bookForm,
    visitor,
  }) => {
    const { share } = builder;
    await builder.shareButton.click();
    await share.regenerateButton.click();
    await expect(share.regenerateModal.body).toContainText(
      'Once you regenerate a new link, the old link will no longer work.',
    );
    await share.regenerateModal.button('Regenerate Link').click();

    await share.regenerateModal.expectClosed();
    await new Toasts(page).expectMessage(
      'The link has been successfully regenerated',
    );
    await expectStaysOpen(share.root);
    const newToken = (await savedForm())?.token ?? '';
    expect(newToken).not.toBe(bookForm.token);
    await expect(share.link).toHaveValue(shareLink(page, newToken));

    const publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);
    await expect(publicForm.main).toContainText(
      'DoesNotExist: Form matching query does not exist.',
    );
    await publicForm.goto(newToken);
    await expect(publicForm.heading).toHaveText('Book intake');
  });

  test('keeps the link when the regeneration is cancelled', async ({
    page,
    bookForm,
  }) => {
    const { share } = builder;
    await builder.shareButton.click();
    await share.regenerateButton.click();
    await share.regenerateModal.button('Cancel').click();

    await share.regenerateModal.expectClosed();
    await expectStaysOpen(share.root);
    await expect(share.link).toHaveValue(shareLink(page, bookForm.token));
    expect((await savedForm())?.token).toBe(bookForm.token);
  });

  test('disables the link after confirmation', async ({
    bookForm,
    visitor,
  }) => {
    const { share } = builder;
    await expect(builder.shareButton).toHaveText('Shared via link');
    await builder.shareButton.click();
    await share.disableButton.click();
    await expect(share.disableModal.body).toHaveText(
      'Are you sure you want to proceed?',
    );
    await share.disableModal.button('Disable Link').click();

    await share.disableModal.expectClosed();
    await expect(share.createLinkButton).toBeVisible();
    await expect(share.link).toBeHidden();
    await expect(builder.shareButton).toHaveText('Share');
    expect(await savedForm()).toMatchObject({
      isPublic: false,
      token: bookForm.token,
    });
    const publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);
    await expect(publicForm.main).toContainText(
      'AssertionError: Insufficient permission to get the form',
    );
  });

  test('brings back the same link when it is created again after disabling', async ({
    page,
    bookForm,
    visitor,
  }) => {
    const { share } = builder;
    await builder.shareButton.click();
    await share.disableButton.click();
    await share.disableModal.button('Disable Link').click();
    await share.disableModal.expectClosed();

    await share.createLinkButton.click();

    await expect(share.link).toHaveValue(shareLink(page, bookForm.token));
    await expect(builder.shareButton).toHaveText('Shared via link');
    expect(await savedForm()).toMatchObject({
      isPublic: true,
      token: bookForm.token,
    });
    const publicForm = new PublicFormPage(visitor);
    await publicForm.goto(bookForm.token);
    await expect(publicForm.heading).toHaveText('Book intake');
  });

  test('hides the regenerate and disable buttons while the form has unsaved changes', async () => {
    const { share } = builder;
    await builder.title.fill('Book donations');
    await builder.shareButton.click();

    await expect(share.unsavedChangesWarning).toBeVisible();
    await expect(share.link).toBeVisible();
    await expect(share.regenerateButton).toBeHidden();
    await expect(share.disableButton).toBeHidden();
  });
});
