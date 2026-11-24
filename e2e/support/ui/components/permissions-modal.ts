import type { Locator, Page } from '@playwright/test';

import { menuItem } from './menu';
import { Modal } from './modal';
import { openSelect } from './select';

/** A role under "Granted Privileges" with its access level. */
export interface AccessRow {
  root: Locator;
  /** The select that an owner of the object gets. */
  accessLevel: Locator;
  /** The text that replaces the select for other roles. */
  staticAccessLevel: Locator;
  removeButton: Locator;
  /** Shows or hides the privilege checkboxes of a custom access level. */
  privilegesToggle: Locator;
  privileges: Locator;
  privilege(name: string): Locator;
}

/** The modal with the owner and the granted privileges of a database, schema, table or view. */
export class PermissionsModal extends Modal {
  /** The "?" next to the title. Its explanation shows in a tooltip on hover. */
  readonly help: Locator;
  readonly tabs: Locator;
  readonly shareTab: Locator;
  readonly transferOwnershipTab: Locator;
  /** The owner with the roles that inherit from it. */
  readonly owner: Locator;
  readonly addRolesButton: Locator;
  readonly accessRows: Locator;
  readonly noAccessNote: Locator;
  readonly newOwner: Locator;

  /** `title` is the full title, for example "Permissions for Books table". */
  constructor(
    private readonly page: Page,
    title: string,
  ) {
    super(page, title);
    this.help = this.title.getByLabel('Help');
    this.tabs = this.root.getByRole('tab');
    this.shareTab = this.root.getByRole('tab', { name: 'Share' });
    this.transferOwnershipTab = this.root.getByRole('tab', {
      name: 'Transfer Ownership',
    });
    this.owner = this.body
      .locator('.section', { has: page.getByText('Owner', { exact: true }) })
      .locator('.role-with-children');
    this.addRolesButton = this.button('Add Role(s)');
    this.accessRows = this.body.locator('.access-control-row');
    this.noAccessNote = this.body.getByText(
      'Access has not been granted for any role.',
    );
    this.newOwner = this.root.getByLabel('New Owner');
  }

  accessRow(role: string): AccessRow {
    const root = this.accessRows.filter({
      has: this.page
        .locator('.name')
        .and(this.page.getByText(role, { exact: true })),
    });
    return {
      root,
      accessLevel: root.locator('button[aria-haspopup="listbox"]'),
      staticAccessLevel: root.locator('.access-level-static'),
      removeButton: root.locator('.access-selection > :last-child button'),
      privilegesToggle: root.getByRole('button', { name: 'Role Privileges' }),
      privileges: root.getByRole('checkbox'),
      // The accessible name of a checkbox is the privilege followed by its help text.
      privilege: (name) =>
        root.getByRole('checkbox', { name: new RegExp(`^${name} `) }),
    };
  }

  /** The entry for a role in the "Add Role(s)" menu, which must be open. */
  candidate(role: string): Locator {
    return menuItem(this.page, role);
  }

  async addRole(role: string): Promise<void> {
    await this.addRolesButton.click();
    await this.candidate(role).click();
  }

  /** Picks an access level by its name, such as "Read" or "Custom". */
  async chooseAccessLevel(role: string, level: string): Promise<void> {
    const options = await openSelect(this.accessRow(role).accessLevel);
    await options
      .getByRole('option')
      .filter({ has: this.page.getByText(level, { exact: true }) })
      .click();
  }

  /** An entry of the list under "New Owner", which must be open. */
  newOwnerOption(role: string): Locator {
    return this.page
      .getByRole('listbox')
      .getByRole('option', { name: role, exact: true });
  }
}
