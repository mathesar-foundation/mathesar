import { readFile } from 'node:fs/promises';

import { type Locator, type Page, expect } from '@playwright/test';

import type { Schema, Table } from '../../api/mathesar';
import { Modal } from '../components/modal';
import { chooseOption } from '../components/select';
import { Sheet } from '../components/sheet';
import { tooltip } from '../components/tooltip';
import { schemaUrl } from '../urls';
import { SchemaFormModal } from './database-page';
import {
  type TransformationKind,
  TransformationsPane,
} from './exploration-transformations';

export function dataExplorerUrl(schema: Schema): string {
  return `${schemaUrl(schema)}data-explorer/`;
}

export function explorationUrl(schema: Schema, explorationId: number): string {
  return `${schemaUrl(schema)}explorations/${explorationId}/`;
}

/** The addresses of all saved explorations of a schema. */
export function anyExplorationUrl(schema: Schema): RegExp {
  return new RegExp(`${schemaUrl(schema)}explorations/\\d+/$`);
}

export function explorationIdIn(url: string): number {
  return Number(/\/explorations\/(\d+)\//.exec(url)?.[1]);
}

async function dragSideways(handle: Locator, byPixels: number): Promise<void> {
  const { mouse } = handle.page();
  await handle.hover();
  const box = await handle.boundingBox();
  if (!box) throw new Error('The handle to drag is not visible');
  const y = box.y + box.height / 2;
  await mouse.down();
  await mouse.move(box.x + box.width / 2 + byPixels, y, { steps: 5 });
  await mouse.up();
}

type ColumnSection =
  | 'From Base Table'
  | 'From Related Tables'
  | 'References From Base Table'
  | 'References To Base Table';

/** A table that a foreign key links to the base table, in the "Select Columns" tab. */
export class LinkedTable {
  /** Shows and hides the columns of the table. */
  readonly toggle: Locator;
  /** The names of the columns, and of the columns of tables linked further on. */
  readonly columnNames: Locator;
  private readonly root: Locator;

  constructor(
    private readonly page: Page,
    list: Locator,
    table: string,
    foreignKeyColumn: string,
  ) {
    this.toggle = list.getByRole('button', {
      name: `${table} via ${foreignKeyColumn}`,
      exact: true,
    });
    this.root = this.toggle.locator(
      'xpath=ancestor::*[contains(concat(" ", @class, " "), " table-group ")][1]',
    );
    this.columnNames = this.root.locator('.selectable-column .name-with-icon');
  }

  /** The button that adds a column. The table's own columns come before those of nested tables. */
  column(name: string): Locator {
    return this.root
      .locator('.selectable-column')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .first()
      .getByRole('button');
  }
}

/** The "Select Columns" tab: the columns of the base table and of the tables linked to it. */
export class ColumnPicker {
  readonly root: Locator;

  constructor(
    private readonly page: Page,
    panel: Locator,
  ) {
    this.root = panel.locator('[data-identifier="column-selection-list"]');
  }

  section(title: ColumnSection): Locator {
    return this.root.locator('section', {
      has: this.page.getByText(title, { exact: true }),
    });
  }

  /** The names of the columns of the base table, in the order of the list. */
  get baseColumnNames(): Locator {
    return this.section('From Base Table').locator(
      '.selectable-column .name-with-icon',
    );
  }

  private baseColumnEntry(name: string): Locator {
    return this.section('From Base Table')
      .locator('.selectable-column')
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** The button that adds a column of the base table. It has no accessible name of its own. */
  baseColumn(name: string): Locator {
    return this.baseColumnEntry(name).getByRole('button');
  }

  /** How often a column of the base table is part of the exploration. Absent when it is not. */
  usageCount(name: string): Locator {
    return this.baseColumnEntry(name).locator('.badge');
  }

  linkedTable(table: string, foreignKeyColumn: string): LinkedTable {
    return new LinkedTable(this.page, this.root, table, foreignKeyColumn);
  }
}

/** The result grid of an exploration with its status bar. */
export class ExplorationResults {
  /** The grid uses the markup of the table page. Its cells are read-only. */
  readonly sheet: Sheet;
  /** The header buttons of the columns that hold a selected cell. */
  readonly selectedColumnHeaders: Locator;
  /** Replaces the grid when the exploration cannot run. */
  readonly error: Locator;
  /** Removes the columns that PostgreSQL no longer has. */
  readonly recoveryButton: Locator;
  /** The record count, the pagination, the page size and the refresh button. */
  readonly statusBar: Locator;
  readonly pagination: Locator;
  /** A custom select. Choose from it with `chooseOption`. */
  readonly pageSize: Locator;
  /** Reads "Loading" during a run and "Retry" after a failed one. */
  readonly refreshButton: Locator;

  constructor(page: Page) {
    const root = page.locator('[data-identifier="query-run-result"]');
    this.sheet = new Sheet(page, root.locator('.sheet'));
    this.selectedColumnHeaders = root.locator('.column-name-wrapper.selected');
    this.error = root.locator('.query-run-errors');
    this.recoveryButton = this.error.getByRole('button', {
      name: 'Attempt Exploration recovery',
    });
    this.statusBar = page.locator('[data-identifier="status-bar"]');
    this.pagination = this.statusBar.getByRole('navigation', {
      name: 'Pagination',
    });
    this.pageSize = this.statusBar.locator('button[aria-haspopup="listbox"]');
    this.refreshButton = this.statusBar.locator('.refresh-button button');
  }

  /** The button in a column header. A click selects the column. */
  columnHeaderButton(name: string): Locator {
    return this.sheet.columnHeader(name).getByRole('button');
  }

  /** The handle on the right edge of a column header. A double click resets the width. */
  columnResizer(name: string): Locator {
    return this.sheet.columnHeader(name).locator('.column-resizer');
  }

  /** Drags the right edge of a column header sideways. */
  async resizeColumn(name: string, byPixels: number): Promise<void> {
    await dragSideways(this.columnResizer(name), byPixels);
  }

  /** The disabled checkbox that shows a boolean value. */
  checkbox(row: number, columnName: string): Locator {
    return this.sheet.cell(row, columnName).getByRole('checkbox');
  }

  paginationLink(name: 'Previous' | 'Next' | `Goto Page ${number}`): Locator {
    return this.pagination.getByRole('link', { name, exact: true });
  }

  /** Resolves when no run is in flight, so that a late result cannot change the page under a test. */
  async expectLoaded(): Promise<void> {
    await expect(this.refreshButton).toHaveText(/Refresh|Retry/);
  }

  /**
   * Asserts the text of the cells of all rows on the page, given without the
   * row number. A boolean cell has no text, a list joins its values by spaces.
   */
  async expectRows(rows: string[][]): Promise<void> {
    await expect(this.sheet.recordRows).toHaveText(
      rows.map((cells, index) => [index + 1, ...cells].join(' ')),
      { useInnerText: true },
    );
  }
}

/** The side panel on the right of the Data Explorer. */
export class ExplorationInspector {
  readonly root: Locator;
  /** The content of the tab that is open. */
  readonly panel: Locator;
  readonly selectedTab: Locator;
  /** The name of the exploration or of the selected column, depending on the tab. */
  readonly name: Locator;
  readonly description: Locator;
  readonly deleteButton: Locator;
  /** The column and the table that the selected column comes from. */
  readonly columnSource: Locator;
  /** The column that the selected column aggregates. */
  readonly aggregationSource: Locator;
  readonly removeColumnButton: Locator;
  /** The wrapper of `removeColumnButton`, which shows the tooltip of a disabled button. */
  readonly removeColumnHelp: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('complementary').filter({
      has: page.getByRole('tab', { name: 'Cell', exact: true }),
    });
    this.panel = this.root.getByRole('tabpanel');
    this.selectedTab = this.root.getByRole('tab', { selected: true });
    this.name = this.panel.getByLabel('Name');
    this.description = this.panel.getByLabel('Description');
    this.deleteButton = this.panel.getByRole('button', {
      name: 'Delete Exploration',
    });
    this.columnSource = this.panel.locator('[data-identifier="column-source"]');
    this.aggregationSource = this.panel.locator(
      '[data-identifier="aggregation-source"]',
    );
    this.removeColumnButton = this.panel.getByRole('button', {
      name: /^Remove Columns? From Query$/,
    });
    this.removeColumnHelp = this.panel
      .locator('.delete-column')
      .getByLabel('Help');
  }

  tab(name: 'Exploration' | 'Column' | 'Cell'): Locator {
    return this.root.getByRole('tab', { name, exact: true });
  }
}

export class DataExplorerPage {
  /** The name of a saved exploration. */
  readonly heading: Locator;
  readonly description: Locator;
  /** "Exploring from" for a new exploration, "Based on" for a saved one. */
  readonly baseTableLabel: Locator;
  readonly baseTableName: Locator;
  /** A custom select, shown until a base table is chosen. */
  readonly baseTableSelect: Locator;
  readonly baseTableHelp: Locator;
  readonly startOverButton: Locator;
  readonly saveButton: Locator;
  /** The red dot on the save button while there are changes to save. */
  readonly unsavedMark: Locator;
  /** The export control is a link while the exploration can be exported. */
  readonly exportLink: Locator;
  /** The export control is a disabled button otherwise. */
  readonly exportButton: Locator;
  /** The wrapper of the export control, which shows its tooltip. */
  readonly exportHelp: Locator;
  readonly inspectorToggle: Locator;
  readonly tooltip: Locator;
  /** Shown above the request for a base table while the schema has no exploration. */
  readonly tutorial: Locator;
  readonly chooseTableHint: Locator;
  readonly addColumnsHint: Locator;
  /** The entries of the breadcrumb in the app header. */
  readonly breadcrumbLinks: Locator;
  /** The left panel with the tabs "Select Columns" and "Transform Results". */
  readonly sidebar: Locator;
  readonly selectColumnsTab: Locator;
  readonly transformResultsTab: Locator;
  /** The text at the top of either tab, shown once the columns have loaded. */
  readonly sidebarIntroduction: Locator;
  readonly columns: ColumnPicker;
  readonly transformations: TransformationsPane;
  readonly results: ExplorationResults;
  readonly inspector: ExplorationInspector;
  readonly saveModal: SchemaFormModal;
  /** Asks how to add a column that has several values per row of the base table. */
  readonly summarizeModal: Modal;
  readonly deleteModal: Modal;

  constructor(readonly page: Page) {
    const header = page.locator('.actions-pane');
    this.heading = header.getByRole('heading', { level: 1 });
    this.description = header.locator('.description');
    this.baseTableLabel = header.locator('.detail');
    this.baseTableName = header.locator('.base-table-holder');
    this.baseTableSelect = header.getByRole('button', { name: 'Select Table' });
    this.baseTableHelp = this.baseTableName.getByLabel('Help').first();
    this.startOverButton = header.getByRole('button', { name: 'Start Over' });
    this.saveButton = header.getByRole('button', { name: 'Save' });
    this.unsavedMark = header.locator('.save-button .dot');
    this.exportLink = header.getByRole('link', { name: 'Export' });
    this.exportButton = header.getByRole('button', { name: 'Export' });
    this.exportHelp = header.getByLabel('Help').filter({ hasText: 'Export' });
    this.inspectorToggle = header.getByRole('button', { name: 'Inspector' });
    this.tooltip = tooltip(page);
    this.tutorial = page.getByText(
      'Create and Share Explorations of Your Data',
    );
    this.chooseTableHint = page.getByText(
      'Get started by selecting a table and adding columns',
    );
    this.addColumnsHint = page.getByText(
      'Get started by adding columns from the left',
    );
    this.breadcrumbLinks = page.getByRole('banner').getByRole('link');
    this.sidebar = page.getByRole('complementary').filter({
      has: page.getByRole('tab', { name: 'Select Columns' }),
    });
    this.selectColumnsTab = this.sidebar.getByRole('tab', {
      name: 'Select Columns',
    });
    this.transformResultsTab = this.sidebar.getByRole('tab', {
      name: 'Transform Results',
    });
    const sidebarPanel = this.sidebar.getByRole('tabpanel');
    this.sidebarIntroduction = sidebarPanel.locator('> .help-text');
    this.columns = new ColumnPicker(page, sidebarPanel);
    this.transformations = new TransformationsPane(page, sidebarPanel);
    this.results = new ExplorationResults(page);
    this.inspector = new ExplorationInspector(page);
    this.saveModal = new SchemaFormModal(page, 'Save Exploration');
    this.summarizeModal = new Modal(page, /Summarize the .+ column\?/);
    this.deleteModal = new Modal(page, 'Delete Exploration?');
  }

  /** Opens the Data Explorer without an exploration. */
  async goto(schema: Schema): Promise<void> {
    await this.page.goto(dataExplorerUrl(schema));
  }

  /** Opens a saved exploration and waits until it can be changed. */
  async gotoSaved(schema: Schema, explorationId: number): Promise<void> {
    await this.page.goto(explorationUrl(schema, explorationId));
    await this.results.expectLoaded();
    await this.expectSidebarLoaded();
  }

  /** Opens the Data Explorer and starts an exploration of a table. */
  async explore(table: Table): Promise<void> {
    await this.goto(table.schema);
    await chooseOption(this.baseTableSelect, table.name);
  }

  /** Adds columns of the base table, one after the other. */
  async addColumns(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.columns.baseColumn(name).click();
      await this.results.expectLoaded();
    }
  }

  /** Opens the "Transform Results" tab and adds a step at the end. */
  async addTransformation(kind: TransformationKind): Promise<void> {
    await this.transformResultsTab.click();
    await this.transformations.addStep(kind);
    await this.results.expectLoaded();
  }

  /** Saves a new exploration through the modal. */
  async saveAs(name: string): Promise<void> {
    await this.saveButton.click();
    await this.saveModal.name.fill(name);
    await this.saveModal.button('Save').click();
    await this.saveModal.expectClosed();
  }

  /** The left panel holds the column list, the right one the inspector. */
  panel(side: 'left' | 'right'): Locator {
    return this.page.locator(`.with-panel.${side} > .panel`);
  }

  /** Drags the inner edge of a side panel. A positive number moves it to the right. */
  async resizePanel(side: 'left' | 'right', byPixels: number): Promise<void> {
    await dragSideways(this.panel(side).locator('> .resizer'), byPixels);
  }

  /**
   * Resolves once the left panel lists the columns of the base table. Changes
   * made before that throw an error (known bug rpc-batch-cancel-uncaught-error).
   */
  async expectSidebarLoaded(): Promise<void> {
    await expect(this.sidebarIntroduction).toBeVisible();
  }

  /** Clicks the export link and reads the file that the browser receives. */
  async exportCsv(): Promise<string> {
    const download = this.page.waitForEvent('download');
    await this.exportLink.click();
    return readFile(await (await download).path(), 'utf8');
  }

  /** Opens another table or exploration of the schema through the selector in the breadcrumb. */
  async switchTo(entityName: string): Promise<void> {
    await this.expectSidebarLoaded();
    await this.page
      .getByRole('button', { name: 'Choose a Table or Exploration' })
      .click();
    await this.page
      .locator('[data-attachable-dropdown]')
      .getByRole('link', { name: entityName, exact: true })
      .click();
  }
}

/** The links on other pages that lead to the Data Explorer. */
export class DataExplorerLinks {
  /** On the schema page, in the header of the explorations. */
  readonly newExploration: Locator;
  /** On the schema page, below the explorations. */
  readonly openDataExplorer: Locator;
  /** In the inspector of the table page. */
  readonly exploreData: Locator;
  /** In the inspector of the table page while the records are grouped. */
  readonly summarizeInDataExplorer: Locator;

  constructor(private readonly page: Page) {
    const main = page.getByRole('main');
    this.newExploration = main.getByRole('link', { name: 'New Exploration' });
    this.openDataExplorer = main.getByRole('link', {
      name: 'Open Data Explorer',
    });
    this.exploreData = main.getByRole('link', { name: /^Explore Data/ });
    this.summarizeInDataExplorer = main.getByRole('link', {
      name: /^Summarize in Data Explorer/,
    });
  }

  /** The entry of a saved exploration on the schema page. */
  savedExploration(name: string): Locator {
    return this.page.getByRole('main').getByRole('link', { name, exact: true });
  }
}
