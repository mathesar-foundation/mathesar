import type { Locator, Page } from '@playwright/test';

import { Modal } from '../components/modal';

type RelationshipType = 'Many to One' | 'One to Many' | 'Many to Many';

/** The section "Relationships" in the Table tab of the inspector. */
export class TableRelationships {
  /** One card per column of this table that links to another table. */
  readonly referencesFromThisTable: Locator;
  /** One card per column of another table that links to this table. */
  readonly referencesToThisTable: Locator;
  readonly emptyNote: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    const section = page.locator('.table-inspector .links-content');
    const cardsUnder = (header: string): Locator =>
      section
        .locator(':scope > div')
        .filter({ has: page.locator('.header', { hasText: header }) })
        .getByRole('link');
    this.referencesFromThisTable = cardsUnder('References From This Table');
    this.referencesToThisTable = cardsUnder('References To This Table');
    this.emptyNote = section.getByText(
      'There are no relationships between this table and other tables.',
    );
    this.createButton = section.getByRole('button', {
      name: 'Create Relationship',
    });
  }
}

/** The form that links the table of the page to a table, with a new column or a new mapping table. */
export class CreateRelationshipModal extends Modal {
  /** A custom select. Choose from it with `chooseOption`. */
  readonly targetTable: Locator;
  /** The kinds of relationship on offer, as radio buttons. */
  readonly types: Locator;
  /** The name of the link column, for the kinds that add one column. */
  readonly columnName: Locator;
  readonly mappingTableName: Locator;
  /** The names of the two link columns of a mapping table, in order. */
  readonly mappingColumnNames: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page, 'Create Relationship');
    this.targetTable = this.body.getByRole('button', {
      name: /^Create Relationship Between/,
    });
    this.types = this.body.getByRole('radio');
    this.columnName = this.body.getByRole('textbox', {
      name: 'Name of New Column',
    });
    this.mappingTableName = this.body.getByRole('textbox', {
      name: 'Table Name',
    });
    this.mappingColumnNames = this.body.getByRole('textbox', {
      name: /^(Name of New Column|Column \d Name)$/,
    });
    this.submitButton = this.footer.getByRole('button', {
      name: 'Create Relationship',
    });
    this.cancelButton = this.footer.getByRole('button', { name: 'Cancel' });
  }

  type(name: RelationshipType): Locator {
    return this.body.getByRole('radio', { name: new RegExp(`^${name}`) });
  }

  /**
   * A line under "What's Changing" that names a table or column to be
   * created. A click unfolds the field that renames it.
   */
  change(text: string | RegExp): Locator {
    return this.body.getByRole('button', { name: text });
  }
}
