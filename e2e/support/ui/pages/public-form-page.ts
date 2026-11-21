import type { Locator, Page } from '@playwright/test';

import { RowSeeker } from '../components/row-seeker';

const NAVIGATIONS = 'e2eNavigations';

type RecordingWindow = Window & Record<string, string[] | undefined>;

export function publicFormUrl(token: string): string {
  return `/shares/forms/${token}/`;
}

/** The page behind the public link of a form, where a visitor fills and submits it. */
export class PublicFormPage {
  /** Holds the fields, and after a submission the confirmation. */
  readonly form: Locator;
  readonly heading: Locator;
  readonly description: Locator;
  readonly clearButton: Locator;
  readonly submitAnotherButton: Locator;
  /** The link to the address that the form sends the visitor to after a submission. */
  readonly redirectLink: Locator;
  readonly submissionError: Locator;
  /** Shows and hides the reason that the server gave for a failed submission. */
  readonly errorDetailsToggle: Locator;
  /** "This form was created with" and the logo, which links to mathesar.org. */
  readonly brandingLink: Locator;
  readonly rowSeeker: RowSeeker;
  readonly datePicker: Locator;
  /** The header of the app, which a visitor never sees. */
  readonly appHeader: Locator;
  /** What shows in place of a form that cannot be loaded. */
  readonly errorHeading: Locator;
  readonly main: Locator;

  constructor(private readonly page: Page) {
    this.form = page.locator('form');
    this.heading = this.form.getByRole('heading', { level: 1 });
    this.description = this.form.locator('.form-description-static');
    this.clearButton = this.form.getByRole('button', { name: 'Clear form' });
    this.submitAnotherButton = this.form.getByRole('button', {
      name: 'Submit another response',
    });
    this.redirectLink = this.form
      .getByText("You'll now be redirected to")
      .getByRole('link');
    this.submissionError = this.form.getByText(
      'There was an error when submitting the form.',
    );
    this.errorDetailsToggle = this.form.getByRole('button', {
      name: 'View details',
    });
    this.brandingLink = this.form.getByRole('link', { name: 'Mathesar' });
    this.rowSeeker = new RowSeeker(page);
    this.datePicker = page.locator('.flatpickr-calendar');
    this.appHeader = page.getByRole('banner');
    this.errorHeading = page.getByRole('heading', { name: 'Error' });
    this.main = page.getByRole('main');
  }

  async goto(token: string): Promise<void> {
    await this.page.goto(publicFormUrl(token));
  }

  /** From now on, records the address of each navigation that the page starts, such as a redirect. */
  async recordNavigations(): Promise<void> {
    await this.page.evaluate((key) => {
      const addresses: string[] = [];
      (window as unknown as RecordingWindow)[key] = addresses;
      navigation.addEventListener('navigate', (event) => {
        addresses.push(event.destination.url);
      });
    }, NAVIGATIONS);
  }

  /** The navigations recorded so far. `undefined` once the page shows another document. */
  recordedNavigations(): Promise<string[] | undefined> {
    return this.page.evaluate(
      (key) => (window as unknown as RecordingWindow)[key],
      NAVIGATIONS,
    );
  }

  /** The input of a field: a text box, the button of a select, or the list box of a foreign key. */
  field(label: string): Locator {
    return this.form.getByLabel(label, { exact: true });
  }

  /** The text of a field's label, which focuses the input on click. */
  label(label: string): Locator {
    return this.form.getByText(label, { exact: true });
  }

  /** The label, the help text, the input and the errors of a field. */
  fieldBlock(label: string): Locator {
    return this.form
      .locator('[data-form-selectable]')
      .filter({ has: this.page.getByLabel(label, { exact: true }) })
      .last();
  }

  requiredMark(label: string): Locator {
    return this.ownLabel(label).getByText('*', { exact: true });
  }

  helpText(label: string): Locator {
    return this.ownLabel(label).locator('.help');
  }

  /** The message under a required field that was filled and then emptied. */
  emptyValueError(label: string): Locator {
    return this.fieldBlock(label).getByText('Value cannot be empty.');
  }

  submitButton(label = 'Submit'): Locator {
    return this.form.getByRole('button', { name: label, exact: true });
  }

  /** A day of the month that the date picker shows. */
  day(dayOfMonth: number): Locator {
    return this.datePicker
      .locator('.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)')
      .filter({ hasText: new RegExp(`^${dayOfMonth}$`) });
  }

  /** Shows next to the record that a foreign key field holds. */
  clearValueButton(label: string): Locator {
    return this.fieldBlock(label).getByRole('button', { name: 'Clear value' });
  }

  /** Opens the list of records of a foreign key field and chooses the one with this summary. */
  async pickRecord(label: string, recordSummary: string): Promise<void> {
    await this.field(label).click();
    await this.rowSeeker.option(recordSummary).click();
  }

  /** A block of a foreign key field also holds the labels of its nested fields, after its own. */
  private ownLabel(label: string): Locator {
    return this.fieldBlock(label).locator('.label-container').first();
  }
}
