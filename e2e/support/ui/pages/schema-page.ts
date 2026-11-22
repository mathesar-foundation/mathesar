import type { Locator, Page } from '@playwright/test';

import type { Schema } from '../../api/mathesar';
import { menuItem, openMenu } from '../components/menu';
import { Modal } from '../components/modal';
import { moreActionsButton } from '../components/more-actions';
import { RecordSelector } from '../components/record-selector';
import { tooltip } from '../components/tooltip';
import { schemaUrl } from '../urls';
import { SchemaFormModal } from './database-page';

function textbox(container: Locator, name: string): Locator {
  return container.getByRole('textbox', { name, exact: true });
}

/** The tables, the explorations or the forms of the schema page. */
export class EntityList {
  readonly items: Locator;
  /** Shown with the error when the list could not be loaded. */
  readonly retryButton: Locator;
  readonly goToDatabaseLink: Locator;

  constructor(
    private readonly page: Page,
    readonly section: Locator,
  ) {
    this.items = section.locator('.entity-list-item');
    this.retryButton = section.getByRole('button', { name: 'Retry' });
    this.goToDatabaseLink = section.getByRole('link', {
      name: 'Go to Database',
    });
  }

  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByRole('link', { name, exact: true }),
    });
  }

  link(name: string): Locator {
    return this.section.getByRole('link', { name, exact: true });
  }

  /** The icon that shows the description of an exploration or a form on hover. */
  descriptionIcon(name: string): Locator {
    return this.item(name).locator('.description-icon');
  }

  menuButton(name: string): Locator {
    return moreActionsButton(this.item(name));
  }

  async chooseAction(name: string, action: string): Promise<void> {
    await this.menuButton(name).click();
    await menuItem(this.page, action).click();
  }
}

export class CreateTableModal extends Modal {
  readonly name: Locator;
  readonly description: Locator;
  /** Shows and hides the fields of the primary key column. */
  readonly primaryKeyToggle: Locator;
  readonly primaryKeyName: Locator;
  /** A custom select. Choose from it with `chooseOption`. */
  readonly primaryKeyType: Locator;

  constructor(page: Page) {
    super(page, 'Create New Table');
    this.name = textbox(this.root, 'Name');
    this.description = textbox(this.root, 'Description');
    this.primaryKeyToggle = this.button('Primary Key Column');
    this.primaryKeyName = textbox(this.root, 'Column Name');
    this.primaryKeyType = this.button('Column Type');
  }
}

/** The confirmation that asks for the name of the table before it deletes it. */
export class DeleteTableModal extends Modal {
  readonly tableName: Locator;

  constructor(page: Page) {
    super(page, 'Delete Table?');
    this.tableName = this.body.getByRole('textbox');
  }
}

/** The modal that creates a form or renames one. */
export class FormModal extends Modal {
  /** A custom select. Choose from it with `chooseOption`. */
  readonly baseTable: Locator;
  readonly name: Locator;
  readonly description: Locator;

  constructor(page: Page, title: string) {
    super(page, title);
    this.baseTable = this.button('Base Table');
    this.name = textbox(this.root, 'Name');
    this.description = textbox(this.root, 'Description');
  }
}

export class SchemaPage {
  readonly header: Locator;
  readonly renameButton: Locator;
  readonly permissionsButton: Locator;
  /** What replaces the page at the URL of a schema that does not exist. */
  readonly notFoundMessage: Locator;
  readonly tables: EntityList;
  readonly tablesHeading: Locator;
  readonly newTableButton: Locator;
  /** The two ways to create a table that a schema without tables offers. */
  readonly fromScratchButton: Locator;
  readonly importFromFileLink: Locator;
  /** The entry of the "New Table" menu that leads to the import page. */
  readonly importMenuLink: Locator;
  /** The entry of a table's menu that opens the table in the Data Explorer. */
  readonly exploreMenuLink: Locator;
  readonly explorations: EntityList;
  readonly explorationsHelp: Locator;
  readonly forms: EntityList;
  readonly newFormButton: Locator;
  readonly tooltip: Locator;
  readonly recordSelector: Locator;
  readonly createTableModal: CreateTableModal;
  readonly deleteTableModal: DeleteTableModal;
  readonly newFormModal: FormModal;

  constructor(private readonly page: Page) {
    const main = page.getByRole('main');
    const sectionWith = (heading: string): Locator =>
      main.locator('section', {
        has: page.getByRole('heading', { name: heading }),
      });
    this.header = page.locator('.schema-page-header');
    this.renameButton = this.header.getByRole('button', {
      name: 'Rename Schema',
    });
    this.permissionsButton = this.header.getByRole('button', {
      name: 'Schema Permissions',
    });
    this.notFoundMessage = page.getByText('Schema not found.');
    this.tables = new EntityList(page, main.locator('.tables'));
    this.tablesHeading = this.tables.section.getByRole('heading');
    this.newTableButton = main.getByRole('button', { name: 'New Table' });
    this.fromScratchButton = this.tables.section.getByRole('button', {
      name: 'From Scratch',
    });
    this.importFromFileLink = this.tables.section.getByRole('link', {
      name: 'Import from a File',
    });
    this.importMenuLink = openMenu(page).getByRole('link', {
      name: 'From Data Import',
    });
    this.exploreMenuLink = openMenu(page).getByRole('link', {
      name: /^Explore (Table|View)$/,
    });
    this.explorations = new EntityList(page, sectionWith('Explorations'));
    this.explorationsHelp = this.explorations.section
      .getByRole('heading', { name: 'Explorations' })
      .getByLabel('Help');
    this.forms = new EntityList(page, sectionWith('Forms'));
    this.newFormButton = this.forms.section.getByRole('button', {
      name: 'New Form',
    });
    this.tooltip = tooltip(page);
    this.recordSelector = new RecordSelector(page).root;
    this.createTableModal = new CreateTableModal(page);
    this.deleteTableModal = new DeleteTableModal(page);
    this.newFormModal = new FormModal(page, 'Create New Form');
  }

  async goto(schema: Schema): Promise<void> {
    await this.page.goto(schemaUrl(schema));
  }

  renameSchemaModal(currentName: string): SchemaFormModal {
    return new SchemaFormModal(this.page, `Rename Schema ${currentName}`);
  }

  permissionsModal(objectName: string, kind: 'schema' | 'table'): Modal {
    return new Modal(this.page, `Permissions for ${objectName} ${kind}`);
  }

  /** The link of the breadcrumb that opens the database page without loading the app again. */
  databaseLink(databaseName: string): Locator {
    return this.page
      .getByRole('banner')
      .getByRole('link', { name: databaseName, exact: true });
  }

  /** The button of a table card. It loses its label when the list is narrow. */
  findRecordButton(tableName: string): Locator {
    return this.tables.item(tableName).locator('.action-button');
  }

  /** The link to the public page of a form that is shared. */
  publicFormLink(formName: string): Locator {
    return this.forms.item(formName).locator('.actions').getByRole('link');
  }

  /** Tables and explorations are renamed in the form that also renames a schema. */
  renameModal(
    kind: 'Table' | 'Exploration',
    currentName: string,
  ): SchemaFormModal {
    return new SchemaFormModal(this.page, `Rename ${kind} ${currentName}`);
  }

  renameFormModal(currentName: string): FormModal {
    return new FormModal(this.page, `Rename Form ${currentName}`);
  }

  deleteModal(kind: 'Exploration' | 'Form', name: string): Modal {
    return new Modal(this.page, `Delete ${kind} ${name}?`);
  }
}
