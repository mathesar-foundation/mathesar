import type { Locator, Page } from '@playwright/test';

import { EditableText } from '../components/editable-text';
import { InspectorSection } from '../components/inspector-section';
import { DeleteTableModal } from './schema-page';
import type { TableInspector } from './table-page';

/** The Table tab of the inspector on the table page, named View for a view. */
export class TableTab {
  /** The headers of the sections, in order. */
  readonly sectionHeaders: Locator;
  /** "Table Properties", or "View Properties" for a view. */
  readonly properties: InspectorSection;
  readonly name: EditableText;
  readonly description: EditableText;
  /** "Table Permissions", or "View Permissions" for a view. */
  readonly permissionsButton: Locator;
  /** Collapsed when the page opens. */
  readonly userTracking: InspectorSection;
  /** A custom select of "None" and the User columns. Choose from it with `chooseOption`. */
  readonly trackedColumn: Locator;
  readonly noUserColumnNote: Locator;
  readonly deleteButton: Locator;
  readonly deleteModal: DeleteTableModal;

  constructor(page: Page, inspector: TableInspector) {
    const { panel } = inspector;
    this.sectionHeaders = panel.locator('.collapsible-header-btn');
    this.properties = new InspectorSection(panel, /(Table|View) Properties/);
    this.name = new EditableText(panel, 'Name');
    this.description = new EditableText(panel, 'Description');
    this.permissionsButton = this.properties.root.getByRole('button', {
      name: /^(Table|View) Permissions$/,
    });
    this.userTracking = new InspectorSection(panel, 'Last Editor Tracking');
    this.trackedColumn = this.userTracking.root.locator(
      '[aria-haspopup="listbox"]',
    );
    this.noUserColumnNote = this.userTracking.root.getByText(
      'You need at least one column set to a User data type to enable last editor tracking.',
    );
    this.deleteButton = panel.getByRole('button', { name: 'Delete Table' });
    this.deleteModal = new DeleteTableModal(page);
  }
}
