import type { Locator, Page } from '@playwright/test';

import { EditableText } from '../components/editable-text';
import { InspectorSection } from '../components/inspector-section';
import { Modal } from '../components/modal';
import { openSelect } from '../components/select';
import type { Sheet } from '../components/sheet';
import type { TableInspector } from './table-page';

/** The icon in a column header that shows the description of the column on hover. */
export function descriptionIcon(sheet: Sheet, columnName: string): Locator {
  return sheet.columnHeader(columnName).getByLabel('Help');
}

/** The section "Data Type": the type of the column and the options of its database type. */
export class DataTypeSection extends InspectorSection {
  /** A custom select. Choose from it with `chooseType`. */
  readonly select: Locator;
  /** The PostgreSQL type that the choices amount to, as "Database Type: integer". */
  readonly databaseType: Locator;
  /** Why the select is disabled for a primary key or a foreign key column. */
  readonly note: Locator;
  readonly dataLossWarning: Locator;
  /** The messages of the option fields. */
  readonly fieldErrors: Locator;
  readonly maxLengthCheckbox: Locator;
  readonly maxLength: Locator;
  // Custom selects. Choose from them with `chooseOption`.
  readonly numberType: Locator;
  readonly integerSize: Locator;
  readonly floatType: Locator;
  readonly maxDigits: Locator;
  readonly decimalPlaces: Locator;
  readonly timeZonesCheckbox: Locator;

  constructor(panel: Locator) {
    super(panel, 'Data Type');
    this.select = this.root.getByRole('button', {
      name: 'Data Type',
      exact: true,
    });
    this.databaseType = this.root.getByText(/^Database Type:/);
    this.note = this.root.locator('.info-box');
    this.dataLossWarning = this.root.getByText(
      'Data loss can result from changing the data type of a column. This action cannot be undone.',
    );
    this.fieldErrors = this.root.locator('.validation-error');
    this.maxLengthCheckbox = this.root.getByRole('checkbox', {
      name: 'Set a maximum length',
    });
    this.maxLength = this.root.getByRole('textbox', {
      name: 'Field Size Limit',
    });
    this.numberType = this.root.getByRole('button', { name: 'Number Type' });
    this.integerSize = this.root.getByRole('button', {
      name: 'Integer Data Size',
    });
    this.floatType = this.root.getByRole('button', {
      name: 'Floating Point Type',
    });
    this.maxDigits = this.root.getByRole('textbox', { name: 'Max Digits' });
    this.decimalPlaces = this.root.getByRole('textbox', {
      name: 'Decimal Places',
    });
    this.timeZonesCheckbox = this.root.getByRole('checkbox', {
      name: 'Support Time Zones',
    });
  }

  /** Opens the select and returns its options, named with the icon and the name of each type. */
  async openTypes(): Promise<Locator> {
    return (await openSelect(this.select)).getByRole('option');
  }

  async chooseType(name: string): Promise<void> {
    const options = await this.openTypes();
    await options
      .filter({ has: this.root.page().getByText(name, { exact: true }) })
      .click();
  }
}

/** The section "Default Value". */
export class DefaultValueSection extends InspectorSection {
  readonly noDefault: Locator;
  readonly customDefault: Locator;
  /** Takes the place of `customDefault` for a column of the User type. */
  readonly defaultUser: Locator;
  /** The input of a text, number or date default. */
  readonly value: Locator;
  /** The select of a boolean default. It has no name. Choose from it with `chooseOption`. */
  readonly booleanValue: Locator;
  /** Opens the list of users for the default of a User column. */
  readonly pickUserButton: Locator;

  constructor(panel: Locator) {
    super(panel, 'Default Value');
    this.noDefault = this.root.getByRole('radio', { name: 'No default value' });
    this.customDefault = this.root.getByRole('radio', {
      name: 'Custom default',
    });
    this.defaultUser = this.root.getByRole('radio', {
      name: 'Set a default user',
    });
    this.value = this.root.getByRole('textbox');
    this.booleanValue = this.root.locator(
      '.default-value-container [aria-haspopup="listbox"]',
    );
    this.pickUserButton = this.root.getByRole('button', {
      name: 'Pick a record',
    });
  }
}

/** The Column tab of the inspector on the table page. */
export class ColumnInspector {
  /** The headers of the sections, in order. */
  readonly sectionHeaders: Locator;
  readonly properties: InspectorSection;
  readonly name: EditableText;
  readonly description: EditableText;
  readonly uniqueCheckbox: Locator;
  readonly notNullCheckbox: Locator;
  /** Takes the place of a checkbox while its change is saved. */
  readonly savingSpinner: Locator;
  /** Takes the place of the checkboxes for the primary key column. */
  readonly primaryKeyTag: Locator;
  /** The table that a foreign key column refers to, next to "Linked To". */
  readonly linkedTable: Locator;
  readonly dataType: DataTypeSection;
  readonly defaultValue: DefaultValueSection;
  readonly extractButton: Locator;
  readonly moveButton: Locator;
  readonly deleteButton: Locator;
  /** Asks to confirm "Delete Column", from the inspector or from the menu of a column header. */
  readonly deleteModal: Modal;
  /** "2 columns selected" while several columns are selected. */
  readonly selectionCount: Locator;
  readonly noSelectionNote: Locator;

  constructor(page: Page, inspector: TableInspector) {
    const { panel } = inspector;
    this.sectionHeaders = panel.locator('.collapsible-header-btn');
    this.properties = new InspectorSection(panel, 'Column Properties');
    this.name = new EditableText(panel, 'Column Name');
    this.description = new EditableText(panel, 'Column Description');
    this.uniqueCheckbox = panel.getByRole('checkbox', {
      name: /^Restrict to Unique/,
    });
    this.notNullCheckbox = panel.getByRole('checkbox', {
      name: /^Disallow NULL Values/,
    });
    this.savingSpinner = this.properties.root.locator('.fa-spin');
    this.primaryKeyTag = this.properties.root.getByText('Primary Key', {
      exact: true,
    });
    this.linkedTable = this.properties.root.getByRole('link');
    this.dataType = new DataTypeSection(panel);
    this.defaultValue = new DefaultValueSection(panel);
    this.extractButton = panel.getByRole('button', {
      name: /^Extract Columns? Into a New Table$/,
    });
    this.moveButton = panel.getByRole('button', {
      name: /^Move Columns? To Linked Table$/,
    });
    this.deleteButton = panel.getByRole('button', { name: 'Delete Column' });
    this.deleteModal = new Modal(page, /^Delete Column/);
    this.selectionCount = panel.getByText(/^\d+ columns selected$/);
    this.noSelectionNote = panel.getByText(
      'Select one or more columns or cells to view the associated column properties and actions.',
    );
  }
}
