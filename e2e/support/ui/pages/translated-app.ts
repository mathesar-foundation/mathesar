import type { Locator, Page } from '@playwright/test';

import { chooseOption } from '../components/select';
import type { DisplayLanguage } from '../components/user-details-form';

/**
 * The app in any display language. It finds controls by the text that a test
 * expects, where the other page objects rely on the English text.
 */
export class TranslatedApp {
  /** The select on the profile page. Its options are English in every language. */
  readonly languageSelect: Locator;

  constructor(private readonly page: Page) {
    this.languageSelect = page
      .getByRole('main')
      .getByRole('button')
      .filter({ hasText: / \((en|es|fr|ja)\)/ });
  }

  heading(name: string): Locator {
    return this.page.getByRole('heading', { name });
  }

  button(name: string): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** A tab, whether or not a help icon follows its name. */
  tab(name: string): Locator {
    return this.page.getByRole('tab', { name });
  }

  link(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  text(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  /** Saves the language on the profile page. `saveButton` is the name of the button in the current language. */
  async chooseLanguage(
    language: DisplayLanguage,
    saveButton: string,
  ): Promise<void> {
    await chooseOption(this.languageSelect, language);
    await this.button(saveButton).click();
  }
}
