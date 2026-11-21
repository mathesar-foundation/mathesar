import type { Locator, Page } from '@playwright/test';

/**
 * The dropdown under a date, time or date and time input: a calendar, the
 * hour and minute fields and buttons for "Today", "Yesterday" or "Now".
 */
export class DateTimePicker {
  readonly root: Locator;
  readonly month: Locator;
  readonly year: Locator;
  readonly selectedDay: Locator;
  readonly nextMonthButton: Locator;
  readonly hour: Locator;
  /** The arrow above the hour field, which adds an hour. */
  readonly hourUpArrow: Locator;
  readonly minute: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('[data-attachable-dropdown]')
      .filter({ has: page.locator('.flatpickr-calendar') });
    this.month = this.root.locator('.cur-month');
    this.year = this.root.getByRole('spinbutton', { name: 'Year' });
    this.selectedDay = this.root.locator('.flatpickr-day.selected');
    this.nextMonthButton = this.root.locator('.flatpickr-next-month');
    this.hour = this.root.getByRole('spinbutton', { name: 'Hour' });
    this.hourUpArrow = this.root
      .locator('.numInputWrapper')
      .filter({ has: page.getByRole('spinbutton', { name: 'Hour' }) })
      .locator('.arrowUp');
    this.minute = this.root.getByRole('spinbutton', { name: 'Minute' });
  }

  /** A day of the month that the calendar shows, not of the months around it. */
  day(dayOfMonth: number): Locator {
    return this.root
      .locator('.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)')
      .filter({ hasText: new RegExp(`^${dayOfMonth}$`) });
  }

  /** The button that sets a relative value, named with that value, for example "05/20/2024 (Today)". */
  preset(name: 'Today' | 'Yesterday' | 'Now'): Locator {
    return this.root.getByRole('button', { name: new RegExp(`\\(${name}\\)$`) });
  }
}
