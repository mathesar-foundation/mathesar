import type { Locator, Page } from '@playwright/test';

import type { Database } from '../../api/mathesar';
import { menuItem } from '../components/menu';
import { Modal } from '../components/modal';

/**
 * The first cell of every row of the grid table in a section. The grid
 * renders its cells flat, so a row is that cell and the siblings after it.
 */
function rowHeads(section: Locator, columnCount: number): Locator {
  return section.locator(
    `.grid-table > .gt-cell:not(.gt-header):nth-child(${columnCount}n + 1)`,
  );
}

function cellAfter(rowHead: Locator, offset: number): Locator {
  return rowHead.locator(`xpath=following-sibling::*[${offset}]`);
}

export class CreateRoleModal extends Modal {
  readonly name: Locator;
  readonly login: Locator;
  readonly password: Locator;
  readonly confirmPassword: Locator;

  constructor(page: Page) {
    super(page, 'Create Role');
    this.name = this.root.getByLabel('Role Name');
    this.login = this.root.getByRole('checkbox', { name: 'LOGIN' });
    this.password = this.root.getByLabel('Password', { exact: true });
    this.confirmPassword = this.root.getByLabel('Confirm Password');
  }
}

export class ChildRolesModal extends Modal {
  readonly addButton: Locator;
  readonly members: Locator;
  readonly unsavedNote: Locator;
  readonly emptyNote: Locator;

  constructor(
    private readonly page: Page,
    parentRole: string,
  ) {
    super(page, `Edit ${parentRole} child roles`);
    this.addButton = this.button('Add Child Role(s)');
    this.members = this.body.locator('.member');
    this.unsavedNote = this.body.getByText(
      'Click Save button to save changes.',
    );
    this.emptyNote = this.body.getByText(
      'The Role does not have any Child Roles',
    );
  }

  member(role: string): Locator {
    return this.members.filter({
      has: this.page.getByText(role, { exact: true }),
    });
  }

  removeButton(role: string): Locator {
    return this.member(role).getByRole('button');
  }

  /** The entry for a role in the "Add Child Role(s)" menu, which must be open. */
  candidate(role: string): Locator {
    return menuItem(this.page, role);
  }

  async add(role: string): Promise<void> {
    await this.addButton.click();
    await this.candidate(role).click();
  }
}

export interface RoleRow {
  name: Locator;
  loginMark: Locator;
  childRoles: Locator;
  editChildRolesButton: Locator;
  dropButton: Locator;
}

/** Database Settings > Roles: the roles of the PostgreSQL server. */
export class RolesSection {
  readonly createRoleButton: Locator;
  readonly createRoleModal: CreateRoleModal;
  readonly dropRoleModal: Modal;
  private readonly rowHeads: Locator;

  constructor(
    private readonly page: Page,
    section: Locator,
  ) {
    this.createRoleButton = section.getByRole('button', {
      name: 'Create Role',
    });
    this.createRoleModal = new CreateRoleModal(page);
    this.dropRoleModal = new Modal(page, /^Drop role/);
    this.rowHeads = rowHeads(section, 4);
  }

  row(role: string): RoleRow {
    const name = this.rowHeads.and(this.page.getByText(role, { exact: true }));
    const childRoles = cellAfter(name, 2);
    return {
      name,
      loginMark: cellAfter(name, 1).getByRole('img', { name: 'Yes' }),
      childRoles: childRoles.getByRole('listitem'),
      editChildRolesButton: childRoles.getByRole('button'),
      dropButton: cellAfter(name, 3).getByRole('button', {
        name: 'Drop Role',
      }),
    };
  }

  childRolesModal(parentRole: string): ChildRolesModal {
    return new ChildRolesModal(this.page, parentRole);
  }
}

export class StoredPasswordModal extends Modal {
  readonly password: Locator;

  constructor(page: Page, role: string) {
    super(page, `Update stored role ${role}`);
    this.password = this.root.getByLabel('Password');
  }
}

export interface StoredRoleRow {
  name: Locator;
  storedMark: Locator;
  /** Stores a password for a role that has none, or replaces the stored one. */
  passwordButton: Locator;
  removeButton: Locator;
}

/** Database Settings > Stored Roles: the roles that Mathesar keeps a password of. */
export class StoredRolesSection {
  readonly removeModal: Modal;
  private readonly rowHeads: Locator;

  constructor(
    private readonly page: Page,
    section: Locator,
  ) {
    this.removeModal = new Modal(page, /^Remove Stored Role for/);
    this.rowHeads = rowHeads(section, 2);
  }

  row(role: string): StoredRoleRow {
    const name = this.rowHeads.filter({
      has: this.page.getByText(role, { exact: true }),
    });
    const stored = cellAfter(name, 1);
    return {
      name,
      storedMark: stored.getByRole('img', { name: 'Yes' }),
      passwordButton: stored.getByRole('button').first(),
      removeButton: stored.getByRole('button', {
        name: 'Remove Stored Role',
      }),
    };
  }

  passwordModal(role: string): StoredPasswordModal {
    return new StoredPasswordModal(this.page, role);
  }
}

/** The modals that add a collaborator and that change a collaborator's role. */
export class CollaboratorModal extends Modal {
  readonly user: Locator;
  readonly role: Locator;

  constructor(
    private readonly page: Page,
    title: string | RegExp,
  ) {
    super(page, title);
    this.user = this.root.getByLabel('Mathesar User');
    this.role = this.root.getByLabel('Role');
  }

  /** An entry of the list under "Mathesar User", which must be open. */
  userOption(username: string): Locator {
    return this.page
      .getByRole('listbox')
      .getByRole('option', { name: username, exact: true });
  }
}

export interface CollaboratorRow {
  user: Locator;
  role: Locator;
  changeRoleButton: Locator;
  removeButton: Locator;
}

/** Database Settings > Collaborators: the Mathesar users with access to the database. */
export class CollaboratorsSection {
  readonly addButton: Locator;
  readonly addModal: CollaboratorModal;
  readonly removeModal: Modal;
  readonly emptyNote: Locator;
  private readonly rowHeads: Locator;

  constructor(
    private readonly page: Page,
    section: Locator,
  ) {
    this.addButton = section.getByRole('button', { name: 'Add Collaborator' });
    this.addModal = new CollaboratorModal(page, 'Add Collaborator');
    this.removeModal = new Modal(page, /as a collaborator on the/);
    this.emptyNote = section.getByText(
      'No collaborators have been added to this database.',
    );
    this.rowHeads = rowHeads(section, 3);
  }

  /** Finds a collaborator by the name the list shows: the full name, or else the username. */
  row(displayName: string): CollaboratorRow {
    const user = this.rowHeads.filter({
      has: this.page.getByText(displayName, { exact: true }),
    });
    const role = cellAfter(user, 1);
    return {
      user,
      role,
      changeRoleButton: role.getByRole('button'),
      removeButton: cellAfter(user, 2).getByRole('button', {
        name: 'Remove Collaborator',
      }),
    };
  }

  changeRoleModal(displayName: string): CollaboratorModal {
    return new CollaboratorModal(this.page, `Change Role for ${displayName}`);
  }
}

export type SettingsSection = 'Roles' | 'Stored Roles' | 'Collaborators';

const sectionPaths: Record<SettingsSection, string> = {
  Roles: 'roles',
  'Stored Roles': 'role-configuration',
  Collaborators: 'collaborators',
};

/** The content of the "Database Settings" tab of the database page. */
export class DatabaseSettingsPage {
  readonly heading: Locator;
  /** The "?" next to the heading. Its explanation shows in a tooltip on hover. */
  readonly help: Locator;
  /** The error that replaces the content of a section that could not load. */
  readonly loadError: Locator;
  readonly roles: RolesSection;
  readonly storedRoles: StoredRolesSection;
  readonly collaborators: CollaboratorsSection;
  private readonly navigation: Locator;

  constructor(private readonly page: Page) {
    const panel = page.getByRole('tabpanel', { name: 'Database Settings' });
    this.navigation = panel.getByRole('complementary');
    const section = panel.getByRole('main');
    this.heading = section.locator('header .title');
    this.help = this.heading.getByLabel('Help');
    this.loadError = section.locator('.error-box');
    this.roles = new RolesSection(page, section);
    this.storedRoles = new StoredRolesSection(page, section);
    this.collaborators = new CollaboratorsSection(page, section);
  }

  async goto(database: Database, section: SettingsSection): Promise<void> {
    await this.page.goto(sectionUrl(database, section));
  }

  sectionLink(section: SettingsSection): Locator {
    return this.navigation.getByRole('link', { name: section, exact: true });
  }
}

export function sectionUrl(
  database: Database,
  section: SettingsSection,
): string {
  return `/db/${database.id}/settings/${sectionPaths[section]}/`;
}
