import type { Locator, Page, Response } from '@playwright/test';

import { ConstraintsModal } from '../components/constraints-modal';
import { TablePage } from './table-page';
import { TableTab } from './table-tab';

interface RpcCall {
  method: string;
}

/**
 * Resolves when the privileges of the user's role on the database have
 * arrived. The database page shows its schemas before they do.
 */
export function databasePrivilegesLoaded(page: Page): Promise<Response> {
  return page.waitForResponse((response) => {
    if (!response.url().endsWith('/api/rpc/v0/')) return false;
    const body = response.request().postDataJSON() as RpcCall | RpcCall[];
    return [body].flat().some((call) => call.method === 'databases.get');
  });
}

/** The table page, with what replaces the sheet when the role may not read the table. */
export class GatedTablePage extends TablePage {
  readonly noSelectWarning: Locator;
  /** The name field of the Table tab of the inspector. */
  readonly tableName: Locator;
  readonly constraintsModal: ConstraintsModal;

  constructor(page: Page) {
    super(page);
    this.noSelectWarning = page.getByText(
      'Your role does not have the privileges to view this table.',
    );
    this.tableName = new TableTab(page, this.inspector).name.input;
    this.constraintsModal = new ConstraintsModal(page);
  }
}
