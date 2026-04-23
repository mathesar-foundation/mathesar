import * as path from 'node:path';
import { expect } from '@playwright/test';
import { defineScenario } from '../../framework/src';
import { connectDatabase } from './connect-database';
import { createSchema } from './create-schema';
import { createTableFromFile } from './create-table-from-file';
import { renameColumn } from './rename-column';
import { extractColumnsToNewTable } from './extract-columns-to-new-table';
import { moveColumnsToLinkedTable } from './move-columns-to-linked-table';
import { HomePage } from '../interactions/regions/home.page';
import { DatabasePage } from '../interactions/regions/database.page';
import { SchemaPage } from '../interactions/regions/schema.page';
import { TablePage } from '../interactions/regions/table.page';

const login = { user: 'admin', password: 'mathesar_password' };
const databaseName = 'BikeshopDB';
const schemaName = 'Bike Shop';

const csvFile = path.resolve(__dirname, '../data/bikeshop_services.csv');

defineScenario({
  code: 'bikeshop-services-modeling',
  description:
    'A user imports a flat bike-shop services CSV and normalizes it into ' +
    'seven linked tables using extract + move-to-linked-table flows.',

  scenario: async (t) => {
    // 1. Create the BikeshopDB with no sample schemas.
    await t.ensure(connectDatabase, { login, databaseName });

    // 2. Create the Bike Shop schema separately.
    const { schema } = await t.ensure(createSchema, {
      login,
      databaseName,
      schemaName,
    });

    // 3. Import the CSV as "Service Milestones" with milestone_id as the PK
    //    and milestone_notes retyped from URI to Text.
    const { table: serviceMilestones } = await t.perform(createTableFromFile, {
      login,
      databaseName,
      schemaName: schema.schemaName,
      csvFile,
      tableName: 'Service Milestones',
      columnRetypes: [{ name: 'milestone_notes', newType: 'Text' }],
      primaryKey: { strategy: 'existing', columnName: 'milestone_id' },
    });

    // 4. Rename the PK column to a simpler `id`.
    await t.perform(renameColumn, {
      login,
      table: serviceMilestones,
      currentName: 'milestone_id',
      newName: 'id',
    });

    // The extract/move tasks select the first column in the grid and add
    // the rest via the dialog's MultiSelect, so column order in the grid
    // doesn't matter. See `extract-columns-to-new-table.ts` for rationale.

    // 5. Extract Mechanics (mechanic_first_name + mechanic_last_name).
    await t.perform(extractColumnsToNewTable, {
      login,
      table: serviceMilestones,
      sourceColumns: ['mechanic_first_name', 'mechanic_last_name'],
      newTableName: 'Mechanics',
    });

    // 6. Extract Customers (customer_first_name + customer_last_name).
    await t.perform(extractColumnsToNewTable, {
      login,
      table: serviceMilestones,
      sourceColumns: ['customer_first_name', 'customer_last_name'],
      newTableName: 'Customers',
    });

    // 7. Move customer_phone and customer_email INTO the existing Customers
    //    table (not a new extract). This uses the `Move Columns To Linked
    //    Table` button, which only appears because Service Milestones now
    //    has an outgoing FK to Customers.
    await t.perform(moveColumnsToLinkedTable, {
      login,
      table: serviceMilestones,
      sourceColumns: ['customer_phone', 'customer_email'],
      linkedTableName: 'Customers',
    });

    // 8. Extract Service Statuses — override the auto-populated link column
    //    name ("Service Statuses") to the singular "Service Status".
    await t.perform(extractColumnsToNewTable, {
      login,
      table: serviceMilestones,
      sourceColumns: ['status_name'],
      newTableName: 'Service Statuses',
      linkColumnName: 'Service Status',
    });

    // 9. Extract Equipment Types — Mathesar auto-populates link column name
    //    as singular "Equipment Type", which is what we want.
    await t.perform(extractColumnsToNewTable, {
      login,
      table: serviceMilestones,
      sourceColumns: ['equipment_type_name'],
      newTableName: 'Equipment Types',
    });

    // 10. Extract Equipments — takes the FK column "Equipment Type" plus
    //     equipment_notes and equipment_serial_number.
    await t.perform(extractColumnsToNewTable, {
      login,
      table: serviceMilestones,
      sourceColumns: [
        'Equipment Type',
        'equipment_notes',
        'equipment_serial_number',
      ],
      newTableName: 'Equipments',
    });

    // 11. Extract Service Requests — pulls the request_* + FK columns into
    //     their own entity.
    await t.perform(extractColumnsToNewTable, {
      login,
      table: serviceMilestones,
      sourceColumns: [
        'Equipment',
        'Customer',
        'Mechanic',
        'request_cost',
        'request_time_in',
        'request_time_out',
        'request_description',
      ],
      newTableName: 'Service Requests',
    });

    // 12–13. Tidy up remaining column names.
    await t.perform(renameColumn, {
      login,
      table: serviceMilestones,
      currentName: 'milestone_notes',
      newName: 'notes',
    });
    await t.perform(renameColumn, {
      login,
      table: serviceMilestones,
      currentName: 'milestone_update_time',
      newName: 'update_time',
    });

    // 14. Verify the end state from a fresh page load.
    await t.check(
      'Seven normalized tables exist in the Bike Shop schema with valid data',
      async ({ page }) => {
        const home = new HomePage(page);
        await home.goto();
        await home.databaseLink(databaseName).click();
        const database = new DatabasePage(page);
        await database.schemaLink(schemaName).click();
        const schemaPage = new SchemaPage(page);

        const expectedTables = [
          'Service Milestones',
          'Mechanics',
          'Customers',
          'Service Statuses',
          'Equipment Types',
          'Equipments',
          'Service Requests',
        ];
        for (const name of expectedTables) {
          await expect(schemaPage.tableLink(name)).toBeVisible();
        }

        // Spot-check the root Service Milestones table.
        await schemaPage.tableLink('Service Milestones').click();
        const table = new TablePage(page);
        await expect(table.heading).toHaveText('Service Milestones');
        await table.waitForLoaded();

        // Renamed columns are present.
        await expect(table.grid.columnHeader('id')).toBeVisible();
        await expect(table.grid.columnHeader('notes')).toBeVisible();
        await expect(table.grid.columnHeader('update_time')).toBeVisible();

        // Row count matches the CSV's 100 data rows.
        await expect(
          page.getByText(/Showing 1[\u2013\-]\d+ of 100/),
        ).toBeVisible();
      },
    );
  },
});
