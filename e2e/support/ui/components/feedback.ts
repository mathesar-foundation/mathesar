import { type Locator, type Page, expect } from '@playwright/test';

/** The feedback form that drops down from the app header. */
export class Feedback {
  readonly trigger: Locator;
  readonly panel: Locator;
  readonly message: Locator;
  readonly sendButton: Locator;
  readonly clearButton: Locator;
  readonly error: Locator;
  readonly surveyLink: Locator;

  constructor(private readonly page: Page) {
    this.trigger = page
      .getByRole('banner')
      .getByRole('button', { name: 'Feedback', exact: true });
    // The dropdown has no role and no accessible name.
    this.panel = page.locator('.feedback-content');
    this.message = this.panel.getByRole('textbox');
    this.sendButton = this.panel.getByRole('button', { name: 'Send Feedback' });
    this.clearButton = this.panel.getByRole('button', { name: 'Clear' });
    this.error = this.panel.locator('.error-box');
    this.surveyLink = this.panel.getByRole('link', { name: 'Go to Survey' });
  }

  async open(): Promise<void> {
    await this.trigger.click();
    await expect(this.panel).toBeVisible();
  }

  async close(): Promise<void> {
    await this.trigger.click();
    await expect(this.panel).toBeHidden();
  }

  /**
   * Answers the upload as Mathesar does when it reaches the feedback server.
   * Returns the messages of the uploads, which fill in as they are sent.
   */
  async acceptUploads(): Promise<string[]> {
    const messages: string[] = [];
    await this.page.route('**/api/rpc/v0/', async (route) => {
      const { id, method, params } = route.request().postDataJSON() as {
        id: number;
        method: string;
        params: { message: string };
      };
      if (method !== 'analytics.upload_feedback') return route.fallback();
      messages.push(params.message);
      return route.fulfill({ json: { jsonrpc: '2.0', id, result: null } });
    });
    return messages;
  }
}
