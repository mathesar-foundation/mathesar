import type { Locator, Page } from '@playwright/test';

import { ConstraintsModal } from '../components/constraints-modal';
import { MultiSelect } from '../components/multi-select';

type ConstraintKind = 'Primary Keys' | 'Foreign Keys' | 'Unique';

/** The constraints of one kind in the constraints modal, with the form that adds one. */
export class ConstraintSection {
  /** Opens the form. The primary key has none. */
  readonly addButton: Locator;
  /** One line per constraint, named by its columns. A click unfolds its details. */
  readonly constraints: Locator;
  readonly emptyNote: Locator;
  readonly form: Locator;
  /** In the unique form. */
  readonly columns: MultiSelect;
  /** In the foreign key form. Custom selects: choose from them with `chooseOption`. */
  readonly referencingColumn: Locator;
  readonly targetTable: Locator;
  readonly targetColumn: Locator;
  /** Shows once "Manually" is chosen. */
  readonly constraintName: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(
    private readonly page: Page,
    readonly root: Locator,
  ) {
    this.addButton = root.getByRole('button', { name: 'Add', exact: true });
    this.constraints = root.locator('.collapsible');
    this.emptyNote = root.getByText(/^No .* Constraints$/);
    this.form = root.locator('.add-constraint');
    this.columns = new MultiSelect(this.form.locator('.multi-select-trigger'));
    this.referencingColumn = this.form.getByRole('button', {
      name: 'Referencing Column',
    });
    this.targetTable = this.form.getByRole('button', { name: 'Target Table' });
    this.targetColumn = this.form.getByRole('button', {
      name: /^Table Column in /,
    });
    this.constraintName = this.form.getByRole('textbox', {
      name: 'Constraint Name',
    });
    this.submitButton = this.form.getByRole('button', {
      name: /^Add (Unique|Foreign Key) Constraint$/,
    });
    this.cancelButton = this.form.getByRole('button', { name: 'Cancel' });
  }

  /** The constraint on exactly these columns. */
  constraint(...columnNames: string[]): Locator {
    return this.constraints.filter({
      has: this.page.getByRole('button', {
        name: new RegExp(
          `^${columnNames.map((name) => `(\\w+ )?${name}`).join(' ')}$`,
        ),
      }),
    });
  }

  /** The line of a constraint. A click shows or hides its details. */
  header(constraint: Locator): Locator {
    return constraint.locator('.collapsible-header-btn');
  }

  /** It has no accessible name. */
  deleteButton(constraint: Locator): Locator {
    return constraint.locator('.collapsible-header > span').getByRole('button');
  }

  naming(strategy: 'Automatically' | 'Manually'): Locator {
    return this.form.getByRole('radio', { name: strategy });
  }
}

/** The three lists of the constraints modal. `ConstraintsModal` has the parts that other areas use. */
export class TableConstraints {
  readonly modal: ConstraintsModal;

  constructor(private readonly page: Page) {
    this.modal = new ConstraintsModal(page);
  }

  section(kind: ConstraintKind): ConstraintSection {
    return new ConstraintSection(
      this.page,
      this.modal.body.locator('.constraint-type-section').filter({
        has: this.page.locator('.title', { hasText: kind }),
      }),
    );
  }
}
