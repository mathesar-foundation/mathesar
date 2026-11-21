import { expect, test } from '../../support/fixtures';
import { Feedback } from '../../support/ui/components/feedback';
import { ProfilePage } from '../../support/ui/pages/profile-page';

// The stack cannot reach the feedback server, so a real upload always fails.
test.describe('feedback form of the header', () => {
  let feedback: Feedback;

  test.beforeEach(async ({ page }) => {
    feedback = new Feedback(page);
    await new ProfilePage(page).goto();
    await feedback.open();
  });

  test('opens with the message focused', async () => {
    await expect(feedback.panel).toContainText("We'd love to hear from you!");
    await expect(feedback.message).toBeFocused();
  });

  test('can only be sent with a message', async () => {
    await expect(feedback.sendButton).toBeDisabled();

    await feedback.message.fill('Grouping by month would help.');
    await expect(feedback.sendButton).toBeEnabled();

    await feedback.message.fill('');
    await expect(feedback.sendButton).toBeDisabled();
  });

  test('Clear empties the message', async () => {
    await feedback.message.fill('Grouping by month would help.');
    await feedback.clearButton.click();

    await expect(feedback.message).toHaveValue('');
    await expect(feedback.sendButton).toBeDisabled();
  });

  test('keeps an unsent message while the form is closed', async () => {
    await feedback.message.fill('Grouping by month would help.');
    await feedback.close();
    await feedback.open();

    await expect(feedback.message).toHaveValue('Grouping by month would help.');
  });

  test('reports why the feedback was not sent and keeps the message', async () => {
    await feedback.message.fill('Sent by an end-to-end test.');
    await feedback.sendButton.click();

    await expect(feedback.error).toContainText('ConnectionError');
    await expect(feedback.message).toHaveValue('Sent by an end-to-end test.');
    await expect(feedback.sendButton).toBeEnabled();
    await feedback.message.click();
    await expect(feedback.message).toBeFocused();
  });

  test('starts over when the form is reopened after a failed upload', async () => {
    await feedback.message.fill('Sent by an end-to-end test.');
    await feedback.sendButton.click();
    await expect(feedback.error).toBeVisible();
    await feedback.close();
    await feedback.open();

    await expect(feedback.message).toHaveValue('');
    await expect(feedback.error).toBeHidden();
  });

  test('thanks the user and links to the survey after the upload', async () => {
    const uploads = await feedback.acceptUploads();
    await feedback.message.fill('Sent by an end-to-end test.');
    await feedback.sendButton.click();

    await expect(feedback.panel).toContainText('Thank you for your feedback!');
    expect(uploads).toEqual(['Sent by an end-to-end test.']);
    await expect(feedback.surveyLink).toHaveAttribute(
      'href',
      'https://mathesar.org/survey',
    );
    await expect(feedback.message).toBeHidden();

    await feedback.close();
    await feedback.open();
    await expect(feedback.message).toHaveValue('');
  });
});
