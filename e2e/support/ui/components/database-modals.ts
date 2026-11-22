import type { Locator, Page } from '@playwright/test';

import type { ExistingDatabase } from '../../api/mathesar';
import { env } from '../../env';
import { fillFormattedInput } from './formatted-input';
import { Modal } from './modal';

function textbox(container: Locator, name: string): Locator {
  return container.getByRole('textbox', { name, exact: true });
}

/** The fields that the forms to connect a database and to edit its connection share. */
class ConnectionFormModal extends Modal {
  readonly databaseName: Locator;
  readonly useDatabaseName: Locator;
  readonly useNickname: Locator;
  readonly nickname: Locator;
  readonly host: Locator;
  readonly port: Locator;
  /** A custom select. Choose from it with `chooseOption`. */
  readonly sslMode: Locator;

  constructor(page: Page, title: string | RegExp) {
    super(page, title);
    this.databaseName = textbox(this.root, 'Database Name');
    this.useDatabaseName = this.root.getByRole('radio', {
      name: 'Use the database name',
    });
    this.useNickname = this.root.getByRole('radio', {
      name: /^Use a custom nickname instead/,
    });
    this.nickname = textbox(this.root, 'Nickname');
    this.host = textbox(this.root, 'Host');
    this.port = textbox(this.root, 'Port');
    this.sslMode = this.root.getByRole('button', { name: 'SSL Mode' });
  }
}

/** The modal behind "Connect Database". Its title changes with the step. */
export class ConnectDatabaseModal extends ConnectionFormModal {
  readonly createNewOption: Locator;
  readonly connectExistingOption: Locator;
  readonly roleName: Locator;
  readonly password: Locator;
  /** One list item per schema, with its label and help text. */
  readonly schemaOptions: Locator;

  constructor(page: Page) {
    super(
      page,
      /How would you like to connect your database\?|Create a New Database|Connect to an Existing Database/,
    );
    this.createNewOption = this.body.getByRole('button', {
      name: /^Create a New Database/,
    });
    this.connectExistingOption = this.body.getByRole('button', {
      name: /^Connect to an Existing Database/,
    });
    this.roleName = textbox(this.root, 'Role Name');
    this.password = textbox(this.root, 'Password');
    this.schemaOptions = this.root
      .getByRole('group', { name: 'Schemas to install' })
      .getByRole('listitem');
  }

  schemaToInstall(label: string): Locator {
    return this.schemaOptions.filter({ hasText: label }).getByRole('checkbox');
  }

  /** Fills what the form needs to reach a database that exists on a server. */
  async fillExisting(existing: ExistingDatabase): Promise<void> {
    await this.host.fill(existing.host ?? env.postgresFromMathesar.host);
    await fillFormattedInput(this.port, String(env.postgresFromMathesar.port));
    await this.databaseName.fill(existing.name);
    await this.roleName.fill(existing.role);
    await this.password.fill(existing.password);
  }
}

export class EditConnectionModal extends ConnectionFormModal {
  constructor(page: Page, displayName: string) {
    super(page, `Edit ${displayName} Database Connection`);
  }
}

export class DisconnectDatabaseModal extends Modal {
  readonly removeStoredRoles: Locator;
  readonly removeMetadata: Locator;
  readonly keepDatabase: Locator;
  readonly dropDatabase: Locator;
  readonly removeInternalSchemas: Locator;
  readonly removeCustomTypes: Locator;
  readonly useRole: Locator;
  readonly roleName: Locator;
  readonly rolePassword: Locator;

  constructor(page: Page, displayName: string) {
    super(page, `Disconnect ${displayName} Database`);
    const checkbox = (name: RegExp): Locator =>
      this.root.getByRole('checkbox', { name });
    this.removeStoredRoles = checkbox(/^Remove stored roles/);
    this.removeMetadata = checkbox(/^Remove saved explorations/);
    this.keepDatabase = this.root.getByRole('radio', {
      name: 'Keep the database',
    });
    this.dropDatabase = this.root.getByRole('radio', {
      name: 'Drop the database',
    });
    this.removeInternalSchemas = checkbox(
      /^Remove Mathesar's internal schemas/,
    );
    this.removeCustomTypes = checkbox(/^Remove Mathesar's custom data types/);
    this.useRole = checkbox(/^Specify a role to use when removing schemas/);
    this.roleName = textbox(this.root, 'Role Name');
    this.rolePassword = textbox(this.root, 'Role Password');
  }
}

/** The modal that upgrades one database or reinstalls Mathesar's schemas in it. */
export class UpgradeDatabaseModal extends Modal {
  readonly useRole: Locator;
  readonly roleName: Locator;
  readonly rolePassword: Locator;

  private constructor(page: Page, title: string) {
    super(page, title);
    this.useRole = this.root.getByRole('checkbox', {
      name: /^Specify a PostgreSQL Role/,
    });
    this.roleName = textbox(this.root, 'Role Name');
    this.rolePassword = textbox(this.root, 'Role Password');
  }

  static toUpgrade(page: Page, displayName: string): UpgradeDatabaseModal {
    return new UpgradeDatabaseModal(page, `Upgrade ${displayName} Database`);
  }

  static toReinstall(page: Page, displayName: string): UpgradeDatabaseModal {
    return new UpgradeDatabaseModal(
      page,
      `Reinstall Mathesar Schemas on ${displayName} Database`,
    );
  }
}
