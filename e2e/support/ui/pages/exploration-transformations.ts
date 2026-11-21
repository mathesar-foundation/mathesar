import type { Locator, Page } from '@playwright/test';

import { menuItem } from '../components/menu';
import { MultiSelect } from '../components/multi-select';
import { openSelect } from '../components/select';

export type TransformationKind = 'Filter' | 'Sort' | 'Summarize' | 'Hide';

/** Opens a custom select and returns its options. Escape or a choice closes it. */
export async function selectOptions(trigger: Locator): Promise<Locator> {
  return (await openSelect(trigger)).getByRole('option');
}

/** Chooses a column in a select that shows each column with the icon of its type. */
export async function chooseColumn(
  trigger: Locator,
  name: string,
): Promise<void> {
  const options = await selectOptions(trigger);
  await options
    .filter({ has: trigger.page().getByText(name, { exact: true }) })
    .click();
}

/** One step of the "Transform Results" panel. */
export class TransformationStep {
  /** The number and the kind of the step, such as "1 Filter". A click folds the step. */
  readonly header: Locator;
  /** Only the last step has one. The icon has no accessible name. */
  readonly deleteButton: Locator;
  /** The custom selects of the step, in reading order. */
  readonly selects: Locator;

  constructor(readonly root: Locator) {
    this.header = root.locator('.collapsible-header-btn');
    this.deleteButton = this.header.getByRole('button');
    this.selects = root.locator('button[aria-haspopup="listbox"]');
  }
}

export class FilterStep extends TransformationStep {
  readonly column: Locator;
  readonly condition: Locator;
  /** A text input, or a select for a boolean column. Conditions such as "is empty" have none. */
  readonly value: Locator;

  constructor(root: Locator) {
    super(root);
    this.column = root.locator('.filter-column-id');
    this.condition = root.locator('.filter-condition');
    this.value = root.locator('.data-filter-input');
  }
}

export class SortStep extends TransformationStep {
  readonly column: Locator;
  readonly direction: Locator;

  constructor(root: Locator) {
    super(root);
    this.column = this.selects.nth(0);
    this.direction = this.selects.nth(1);
  }
}

export class HideStep extends TransformationStep {
  readonly columns: MultiSelect;

  constructor(root: Locator) {
    super(root);
    this.columns = new MultiSelect(root.locator('.multi-select-trigger'));
  }
}

export class SummarizeStep extends TransformationStep {
  readonly groupColumn: Locator;
  /** How the values of the group column form groups. Only some column types have it. */
  readonly grouping: Locator;
  /** More columns to group by. Shown once a column was taken out of the aggregations. */
  readonly notAggregated: MultiSelect;
  /** One row per aggregated column, such as "Books_Pages as Sum". */
  readonly aggregations: Locator;

  constructor(root: Locator) {
    super(root);
    const groupSelects = root.locator(
      '.summarization > .input-group button[aria-haspopup="listbox"]',
    );
    this.groupColumn = groupSelects.nth(0);
    this.grouping = groupSelects.nth(1);
    this.notAggregated = new MultiSelect(root.locator('.multi-select-trigger'));
    this.aggregations = root.locator('.aggregation');
  }

  private aggregation(column: string): Locator {
    return this.aggregations.filter({
      has: this.root.page().getByText(column, { exact: true }),
    });
  }

  aggregationFunction(column: string): Locator {
    return this.aggregation(column).locator('button[aria-haspopup="listbox"]');
  }

  /** Moves the column from the aggregations to the columns that are grouped by. */
  stopAggregatingButton(column: string): Locator {
    return this.aggregation(column).locator(
      'button:not([aria-haspopup="listbox"])',
    );
  }
}

/** The "Transform Results" tab of the Data Explorer. Steps are numbered from 1, as on the page. */
export class TransformationsPane {
  /** The header of each step: its number and kind. */
  readonly stepHeaders: Locator;
  readonly addStepButton: Locator;
  private readonly steps: Locator;

  constructor(
    private readonly page: Page,
    panel: Locator,
  ) {
    this.steps = panel.locator('.transformations > .collapsible');
    this.stepHeaders = this.steps.locator('.collapsible-header-btn');
    this.addStepButton = panel.getByRole('button', {
      name: 'Add transformation step',
    });
  }

  /** An entry of the menu that `addStepButton` opens. */
  menuEntry(kind: TransformationKind): Locator {
    return menuItem(this.page, kind);
  }

  async addStep(kind: TransformationKind): Promise<void> {
    await this.addStepButton.click();
    await this.menuEntry(kind).click();
  }

  filter(number: number): FilterStep {
    return new FilterStep(this.steps.nth(number - 1));
  }

  sort(number: number): SortStep {
    return new SortStep(this.steps.nth(number - 1));
  }

  hide(number: number): HideStep {
    return new HideStep(this.steps.nth(number - 1));
  }

  summarize(number: number): SummarizeStep {
    return new SummarizeStep(this.steps.nth(number - 1));
  }
}
