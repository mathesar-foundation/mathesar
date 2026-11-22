import {
  type Locator,
  type Page,
  type Request,
  expect,
} from '@playwright/test';

import type { Schema } from '../../api/mathesar';
import { openMenu } from '../components/menu';
import { Modal } from '../components/modal';
import { RowSeeker } from '../components/row-seeker';
import { schemaUrl } from '../urls';
import { RecordSummaryEditor } from './record-summary-editor';

export type ForeignKeyMode =
  'Can only choose' | 'Can choose or create new' | 'Must create new';

export function formBuilderUrl(schema: Schema, formId: number): string {
  return `${schemaUrl(schema)}forms/${formId}/`;
}

function callsRpcMethod(request: Request, method: string): boolean {
  if (!request.url().endsWith('/api/rpc/v0/')) return false;
  const body = request.postDataJSON() as
    { method: string } | { method: string }[];
  return [body].flat().some((call) => call.method === method);
}

/** The labels of fields from top to bottom. Label inputs have no accessible name. */
function labelsOf(fields: Locator): Promise<string[]> {
  return fields.evaluateAll((elements) =>
    elements.map(
      (element) =>
        element.querySelector<HTMLInputElement>('.label input')?.value ?? '',
    ),
  );
}

async function fieldLabelled(
  fields: Locator,
  label: string,
): Promise<CanvasField> {
  await expect.poll(() => labelsOf(fields)).toContain(label);
  const position = (await labelsOf(fields)).indexOf(label);
  return new CanvasField(fields.nth(position));
}

/**
 * A field on the canvas of the form builder. Its controls, other than the
 * label, the help text and the input, show only while the field is selected.
 */
export class CanvasField {
  readonly label: Locator;
  readonly helpText: Locator;
  readonly requiredMark: Locator;
  /** Holds the input that the visitor of the form will fill. A foreign key field that must create a record has none. */
  readonly input: Locator;
  /** The input of a text field that is shown large. */
  readonly textArea: Locator;
  /** The input of a foreign key field, which opens the list of records on click. */
  readonly recordInput: Locator;
  /** The table and the column that the field fills. */
  readonly source: Locator;
  readonly grip: Locator;
  readonly removeButton: Locator;
  /** Shows the tooltip of `removeButton` on hover while the button is disabled. */
  readonly removeButtonWrapper: Locator;
  /** Opens the menu with the columns that can be added below this field. */
  readonly addFieldButton: Locator;
  /** A custom select of a foreign key field. Choose from it with `chooseOption`. */
  readonly modeSelect: Locator;
  /** The fields that create the record of a foreign key field. */
  readonly nestedFields: Locator;
  readonly nestedFieldsHelp: Locator;
  /** The button in the message of a field whose column cannot be used. */
  readonly removeBrokenFieldButton: Locator;

  constructor(readonly root: Locator) {
    // Nested fields repeat these parts further down in the same element.
    const ownLabel = root.locator('.label-container').first();
    this.label = ownLabel.locator('.label input');
    this.helpText = ownLabel.getByPlaceholder('Add help text');
    this.requiredMark = ownLabel.getByText('*', { exact: true });
    this.input = root.locator(
      ':scope > .content > * > .data-form-input, :scope > .content > .fk-field > .fk-input > .data-form-input',
    );
    this.textArea = this.input.locator('textarea');
    this.recordInput = this.input.getByRole('listbox');
    this.source = root.locator(':scope > .header');
    this.grip = root.locator(':scope > .left [data-sortable-trigger]');
    this.removeButtonWrapper = ownLabel.getByLabel('Help');
    this.removeButton = this.removeButtonWrapper.getByRole('button');
    this.addFieldButton = root.locator(':scope > .footer').getByRole('button');
    this.modeSelect = ownLabel.getByRole('button', {
      name: /^(Can only choose|Can choose or create new|Must create new)$/,
    });
    this.nestedFields = root
      .locator('[data-sortable-container]')
      .first()
      .locator(':scope > [data-form-selectable]');
    this.nestedFieldsHelp = root.getByText(/appear only when the user can't/);
    this.removeBrokenFieldButton = root.getByRole('button', {
      name: 'Remove field',
    });
  }

  async select(): Promise<void> {
    await this.label.click();
  }

  /** A nested field by its label, found by its position at the time of the call. */
  nestedField(label: string): Promise<CanvasField> {
    return fieldLabelled(this.nestedFields, label);
  }

  async expectNestedFieldLabels(labels: string[]): Promise<void> {
    await expect.poll(() => labelsOf(this.nestedFields)).toEqual(labels);
  }

  async expectSelected(selected = true): Promise<void> {
    const assertion = selected ? expect(this.root) : expect(this.root).not;
    await assertion.toHaveClass(/(^|\s)selected(\s|$)/);
  }

  /** The mark of a field that holds the selected field. */
  async expectChildSelected(): Promise<void> {
    await expect(this.root).toHaveClass(/immediate-child-selected/);
  }
}

/** The side panel of the form builder. It shows the settings of the selected field, or else of the form. */
export class FormInspector {
  readonly root: Locator;
  /** The buttons that lead from the form to the selected field. */
  readonly path: Locator;
  /** The base table of the form, or the table of the selected field. */
  readonly tableLink: Locator;

  readonly name: Locator;
  readonly description: Locator;
  /** A custom select. Choose from it with `chooseOption`. */
  readonly associatedRole: Locator;
  readonly associatedRoleHelp: Locator;
  readonly buttonLabel: Locator;
  readonly confirmationMessage: Locator;
  readonly redirectToggle: Locator;
  readonly redirectUrl: Locator;
  readonly deleteFormButton: Locator;

  readonly label: Locator;
  readonly required: Locator;
  readonly requiredHelp: Locator;
  /** A custom select of a foreign key field. Choose from it with `chooseOption`. */
  readonly mode: Locator;
  /** A custom select of a text field. Choose from it with `chooseOption`. */
  readonly size: Locator;
  readonly helpTextToggle: Locator;
  readonly helpText: Locator;
  /** Opens the record summary settings of the table that a foreign key field links to. */
  readonly recordSummaryToggle: Locator;
  readonly removeFieldButton: Locator;
  /** Shows the tooltip of `removeFieldButton` on hover while the button is disabled. */
  readonly removeFieldButtonWrapper: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.data-form-inspector');
    this.path = this.root.locator('.form-nav').getByRole('button');
    this.tableLink = this.root.getByRole('link');

    this.name = this.root.getByLabel('Name', { exact: true });
    this.description = this.root.getByLabel('Description', { exact: true });
    const roleSection = this.root.locator('.inspector-section', {
      hasText: 'Associated Role',
    });
    // The select has no label. Its name is the role that is chosen.
    this.associatedRole = roleSection.locator(
      'button[aria-haspopup="listbox"]',
    );
    this.associatedRoleHelp = roleSection
      .getByRole('button', { name: 'Associated Role' })
      .getByLabel('Help');
    this.buttonLabel = this.root.getByLabel('Button label');
    this.confirmationMessage = this.root.getByLabel('Confirmation message');
    this.redirectToggle = this.root.getByLabel('Redirect to URL');
    // The URL input has no label. The confirmation message is a text area.
    this.redirectUrl = this.root
      .getByRole('group', { name: 'After Submission' })
      .locator('input[type="text"]');
    this.deleteFormButton = this.root.getByRole('button', {
      name: 'Delete Form',
    });

    this.label = this.root.getByLabel('Label', { exact: true });
    this.required = this.root.getByRole('checkbox', {
      name: /^Mark field as required/,
    });
    this.requiredHelp = this.root
      .getByText('Mark field as required')
      .getByLabel('Help');
    this.mode = this.root.getByRole('button', {
      name: 'Related record selection',
    });
    this.size = this.root.getByRole('button', { name: 'Size' });
    this.helpTextToggle = this.root.getByLabel('Provide help text');
    this.helpText = this.root.getByPlaceholder('Add help text');
    this.recordSummaryToggle = this.root.getByRole('button', {
      name: 'Linked Record Summary',
    });
    this.removeFieldButton = this.root.getByRole('button', {
      name: 'Remove field',
    });
    this.removeFieldButtonWrapper = this.root
      .getByLabel('Help')
      .filter({ has: page.getByRole('button', { name: 'Remove field' }) });
  }

  /** A step of `path`: "Form" or the column of a field. */
  pathButton(name: string): Locator {
    return this.path.filter({ hasText: name });
  }

  /** The step of `path` that stands for the fields above the parent of the selected field. It has no name. */
  get hiddenFieldsButton(): Locator {
    return this.path.and(
      this.page.getByRole('button', { name: '', exact: true }),
    );
  }

  /** The editor that `recordSummaryToggle` opens. */
  get recordSummary(): RecordSummaryEditor {
    return new RecordSummaryEditor(
      this.page,
      this.root.locator('.record-summary-config'),
    );
  }

  /** An option of the open `associatedRole` select. */
  roleOption(role: string): Locator {
    return this.page
      .getByRole('option')
      .filter({ has: this.page.getByText(role, { exact: true }) });
  }

  /** The icon in the option of a role that the user does not hold. `tooltip` gives the reason on hover. */
  roleOptionHelp(role: string): Locator {
    return this.roleOption(role).getByLabel('Help');
  }

  /** Only the class "disabled" marks a role that the user does not hold. */
  async expectRoleAllowed(role: string, allowed = true): Promise<void> {
    const option = expect(this.roleOption(role));
    await (allowed ? option.not : option).toHaveClass(/(^|\s)disabled(\s|$)/);
  }
}

/** The dropdown of the "Share" button. */
export class SharePanel {
  readonly root: Locator;
  readonly unsavedChangesWarning: Locator;
  readonly createLinkButton: Locator;
  /** The read-only input that holds the public link. */
  readonly link: Locator;
  /** A button with an icon and no name, next to the link. */
  readonly copyButton: Locator;
  readonly openLink: Locator;
  readonly regenerateButton: Locator;
  readonly disableButton: Locator;
  readonly regenerateModal: Modal;
  readonly disableModal: Modal;

  constructor(page: Page) {
    this.root = page
      .locator('[data-attachable-dropdown]')
      .filter({ hasText: /publicly.accessible link/ });
    this.unsavedChangesWarning = this.root.getByText(
      'Form has unsaved changes. Save it to modify sharing settings.',
    );
    this.createLinkButton = this.root.getByRole('button', {
      name: 'Create public link',
    });
    this.link = this.root.getByRole('textbox');
    this.copyButton = this.root.locator('.input-group').getByRole('button');
    this.openLink = this.root.getByRole('link');
    this.regenerateButton = this.root.getByRole('button', {
      name: 'Regenerate Link',
    });
    this.disableButton = this.root.getByRole('button', {
      name: 'Disable Link',
    });
    this.regenerateModal = new Modal(
      page,
      'Remove old link and create a new link?',
    );
    this.disableModal = new Modal(page, 'Disable Link?');
  }
}

export class FormBuilderPage {
  readonly heading: Locator;
  readonly saveButton: Locator;
  /** Its name stays "Share". Its text tells whether the form has a public link. */
  readonly shareButton: Locator;
  readonly inspectorToggle: Locator;
  /** Holds the inspector. Its inner edge changes its width. */
  readonly inspectorPanel: Locator;
  readonly canvas: Locator;
  readonly title: Locator;
  readonly description: Locator;
  /** The fields of the form itself, without nested fields. */
  readonly fields: Locator;
  /** The title, the description or the field that is selected. */
  readonly selection: Locator;
  /** Shows in place of the fields of a form that has none. */
  readonly addFieldsButton: Locator;
  readonly clearButton: Locator;
  /** The menu that adds a field. It names the table and has an item for each column. */
  readonly addFieldMenu: Locator;
  readonly columnItems: Locator;
  readonly inspector: FormInspector;
  readonly share: SharePanel;
  readonly rowSeeker: RowSeeker;
  readonly datePicker: Locator;
  /** Of the element hovered last. The tooltip before it stays for a moment. */
  readonly tooltip: Locator;
  /** Asks before a save that drops fields whose column cannot be used. */
  readonly brokenFieldsModal: Modal;

  constructor(private readonly page: Page) {
    const header = page.locator('.entity-page-header');
    this.heading = header.getByRole('heading', { level: 1 });
    this.saveButton = header.getByRole('button', { name: 'Save' });
    this.shareButton = header.getByRole('button', {
      name: 'Share',
      exact: true,
    });
    this.inspectorToggle = header.getByRole('button', { name: 'Inspector' });
    this.inspectorPanel = page.locator('.with-panel.right > .panel');
    this.canvas = page.locator('.data-form');
    this.title = this.canvas.getByPlaceholder('Name');
    this.description = this.canvas.getByPlaceholder('Description');
    this.fields = this.canvas
      .locator('[data-sortable-container]')
      .first()
      .locator(':scope > [data-form-selectable]');
    this.selection = this.canvas.locator('[data-form-selectable].selected');
    this.addFieldsButton = this.canvas.getByRole('button', {
      name: 'Add fields',
    });
    this.clearButton = this.canvas.getByRole('button', { name: 'Clear form' });
    this.addFieldMenu = openMenu(page);
    this.columnItems = this.addFieldMenu.getByRole('menuitem');
    this.inspector = new FormInspector(page);
    this.share = new SharePanel(page);
    this.rowSeeker = new RowSeeker(page);
    this.datePicker = page.locator('.flatpickr-calendar');
    this.tooltip = page.locator('.dropdown.tooltip').last();
    this.brokenFieldsModal = new Modal(
      page,
      'Saving will remove fields with error',
    );
  }

  /** Opens the builder of the form and waits until it has loaded. */
  async goto(schema: Schema, formId: number): Promise<void> {
    await this.page.goto(formBuilderUrl(schema, formId));
    await this.expectLoaded();
  }

  /** A field by its label, found by its position at the time of the call. */
  field(label: string): Promise<CanvasField> {
    return fieldLabelled(this.fields, label);
  }

  /** Checks the labels of the fields of the form itself, from top to bottom. */
  async expectFieldLabels(labels: string[]): Promise<void> {
    await expect.poll(() => labelsOf(this.fields)).toEqual(labels);
  }

  columnItem(column: string): Locator {
    return this.columnItems.filter({
      has: this.page.getByText(column, { exact: true }),
    });
  }

  /** The icon in the item of a column that cannot be added. `tooltip` gives the reason on hover. */
  columnItemHelp(column: string): Locator {
    return this.columnItem(column).getByLabel('Help');
  }

  /** Saves the form and waits until the builder has loaded the saved form again. */
  async save(): Promise<void> {
    const reloaded = this.page.waitForResponse((response) =>
      callsRpcMethod(response.request(), 'forms.get_source_info'),
    );
    await this.saveButton.click();
    await reloaded;
    await expect(this.saveButton).toBeDisabled();
    await this.expectLoaded();
  }

  /**
   * Waits for the base table and the roles, which the inspector of the form loads after the
   * form. Firefox and WebKit throw when the page is left before (rpc-batch-cancel-uncaught-error).
   */
  async expectLoaded(): Promise<void> {
    await expect(this.inspector.tableLink).toBeVisible();
    await expect(this.inspector.associatedRole).toBeVisible();
  }

  /** The button at the end of the canvas, which previews the label of the submit button. */
  submitButton(label: string): Locator {
    return this.canvas.getByRole('button', { name: label, exact: true });
  }

  /** Deselects what is selected, as a click on the canvas next to the form does. */
  async clickEmptyCanvas(): Promise<void> {
    await this.page.locator('.form-holder').click({ position: { x: 5, y: 5 } });
  }

  /** Drags a field by its grip until it takes the place of another field of the same list. */
  async dragField(field: CanvasField, target: CanvasField): Promise<void> {
    await field.select();
    const grip = await field.grip.boundingBox();
    const from = await field.root.boundingBox();
    const to = await target.root.boundingBox();
    if (!grip || !from || !to) throw new Error('A field is not visible');
    // A field takes the place of another once its leading edge is past the middle of it.
    const distance =
      to.y < from.y ? to.y - from.y : to.y + to.height - from.y - from.height;
    const x = grip.x + grip.width / 2;
    const y = grip.y + grip.height / 2;
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await this.page.mouse.move(x, y + distance, { steps: 10 });
    await this.page.mouse.up();
  }

  /** Drags the inner edge of the inspector. A negative number makes it wider. */
  async resizeInspector(byPixels: number): Promise<void> {
    const edge = this.inspectorPanel.locator('> .resizer');
    await edge.hover();
    const box = await edge.boundingBox();
    if (!box) throw new Error('The edge of the inspector is not visible');
    const y = box.y + box.height / 2;
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width / 2 + byPixels, y, {
      steps: 5,
    });
    await this.page.mouse.up();
  }

  /** The description on the canvas grows with its text. */
  async descriptionHeight(): Promise<number> {
    return (await this.description.boundingBox())?.height ?? 0;
  }

  deleteModal(formName: string): Modal {
    return new Modal(this.page, `Delete Form ${formName}?`);
  }
}
