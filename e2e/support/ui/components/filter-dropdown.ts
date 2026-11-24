import type { Locator, Page } from '@playwright/test';

import type { TablePage } from '../pages/table-page';
import { columnMenuItem } from './column-options';
import { fillFormattedInput } from './formatted-input';
import { chooseOption } from './select';
import { expectLoadingEnded } from './status-bar';

/** A condition is a draggable item that holds one row of selects, not a group. */
const CONDITION_ROW = '.inner-filter > .filter-row:not(.group)';
const CONDITION = `[data-dnd-draggable]:has(> ${CONDITION_ROW})`;

/** One condition of the filter builder: a column, a condition and, for most conditions, a value. */
export class FilterCondition {
  readonly column: Locator;
  readonly condition: Locator;
  /** A text input, a select or a record input, by the data type of the column. */
  readonly value: Locator;
  readonly removeButton: Locator;
  readonly dragHandle: Locator;

  constructor(
    readonly root: Locator,
    private readonly tablePage: TablePage,
  ) {
    this.column = root.locator('.filter-column-id');
    this.condition = root.locator('.filter-condition');
    // The input of a user column lacks the class of the others.
    this.value = root.locator('.data-filter-input, .linked-record-input');
    this.removeButton = root.locator('.remove').getByRole('button');
    this.dragHandle = root.locator('[data-dnd-drag-handle]');
  }

  /**
   * Chooses a condition and types its value, if it takes one. A value kept from the
   * condition before loads records, so typing waits for them (records-request-abort-uncaught).
   */
  async apply(condition: string, value?: string): Promise<void> {
    await chooseOption(this.condition, condition);
    if (value === undefined) return;
    await expectLoadingEnded(this.tablePage);
    await fillFormattedInput(this.value, value);
  }
}

/** A group of the filter builder. The builder as a whole is the outermost group. */
export class FilterGroup {
  /** The select between "where" and "are true": all, any or none of the following. */
  readonly operator: Locator;
  /** The conditions directly in this group, without those of the groups inside it. */
  readonly conditions: Locator;
  /** The "and" or "or" between two entries of the group. */
  readonly connectors: Locator;
  readonly emptyText: Locator;
  readonly addFilterButton: Locator;
  readonly addGroupButton: Locator;
  readonly removeButton: Locator;
  /** Where a dragged condition is dropped to join the group. */
  readonly dropArea: Locator;

  constructor(
    private readonly tablePage: TablePage,
    readonly root: Locator,
  ) {
    const { page } = tablePage;
    const content = root.locator(':scope > .filter-group-content');
    const header = content.locator(':scope > .group-header');
    const actions = content.locator(':scope > .filter-group-actions');
    this.operator = header.locator('.operator-selection').getByRole('button');
    this.removeButton = header.locator('.remove').getByRole('button');
    this.dropArea = content.locator(':scope > [data-dnd-droppable]');
    // Playwright finds nothing for `:scope > a:has(> b)`, so the row is a filter.
    this.conditions = this.dropArea
      .locator(':scope > [data-dnd-draggable]')
      .filter({ has: page.locator(`:scope > ${CONDITION_ROW}`) });
    this.connectors = this.dropArea.locator(
      ':scope > [data-dnd-draggable] > .prefix',
    );
    this.emptyText = this.dropArea.getByText(
      'Add or drag filter conditions here',
    );
    this.addFilterButton = actions.getByRole('button', {
      name: 'Add Filter',
      exact: true,
    });
    this.addGroupButton = actions.getByRole('button', {
      name: 'Add Filter Group',
    });
  }

  condition(index: number): FilterCondition {
    return new FilterCondition(this.conditions.nth(index), this.tablePage);
  }

  async addCondition(columnName: string): Promise<void> {
    await this.addFilterButton.click();
    await columnMenuItem(this.tablePage.page, columnName).click();
  }
}

/** The Filter dropdown of the table page: a menu of columns at first, then the filter builder. */
export class FilterDropdown {
  readonly trigger: Locator;
  /** The filter builder. Not there while the dropdown shows the menu of columns. */
  readonly panel: Locator;
  readonly clearAllButton: Locator;
  /** Every condition of the builder in reading order, whatever its group. */
  readonly conditions: Locator;
  readonly rootGroup: FilterGroup;
  /** The copy of a condition that follows the pointer during a drag. */
  readonly dragGhost: Locator;
  /** The dashed box that marks where a dragged condition would land. */
  readonly dropPlaceholder: Locator;
  private readonly page: Page;
  private readonly nestedGroups: Locator;

  constructor(private readonly tablePage: TablePage) {
    this.page = tablePage.page;
    this.trigger = tablePage.toolbarButton('Filter');
    this.panel = this.page
      .locator('[data-attachable-dropdown]')
      .filter({ hasText: 'Filter records' });
    this.clearAllButton = this.panel
      .locator('.clear-all-button')
      .getByRole('button');
    this.conditions = this.panel.locator(CONDITION);
    this.rootGroup = new FilterGroup(
      tablePage,
      this.panel.locator('.filter-group.top-level'),
    );
    this.nestedGroups = this.panel.locator('.filter-group:not(.top-level)');
    this.dragGhost = this.page.locator('[data-dnd-ghost]');
    this.dropPlaceholder = this.page.locator('[data-dnd-placeholder]');
  }

  condition(index: number): FilterCondition {
    return new FilterCondition(this.conditions.nth(index), this.tablePage);
  }

  /** A group inside the outermost one, in reading order. */
  group(index: number): FilterGroup {
    return new FilterGroup(this.tablePage, this.nestedGroups.nth(index));
  }

  /** Opens the dropdown of a table without filters and picks a column from its menu. */
  async addFirstCondition(columnName: string): Promise<FilterCondition> {
    await this.trigger.click();
    await columnMenuItem(this.page, columnName).click();
    return this.condition(0);
  }

  /**
   * Picks a condition up by its handle and holds it over a group, with the
   * mouse button still down. The drag starts once the pointer has moved a little.
   */
  async dragOver(
    condition: FilterCondition,
    group: FilterGroup,
  ): Promise<void> {
    const handle = await condition.dragHandle.boundingBox();
    const target = await group.dropArea.boundingBox();
    if (!handle || !target) throw new Error('Nothing to drag or to drop on');
    const start = {
      x: handle.x + handle.width / 2,
      y: handle.y + handle.height / 2,
    };
    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down();
    await this.page.mouse.move(start.x + 8, start.y + 8, { steps: 2 });
    await this.page.mouse.move(
      target.x + target.width / 2,
      target.y + target.height - 4,
      { steps: 10 },
    );
  }
}
