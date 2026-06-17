import { chromium, request } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const repoRoot = path.resolve(__dirname, '../..');
const outputDir = path.resolve(__dirname, manifest.outputDir);

const DEFAULTS = {
  baseUrl: 'http://localhost:8000',
  username: 'admin',
  password: 'password',
  pgHost: process.env.README_SCREENSHOTS_PGHOST ?? 'localhost',
  pgPort: Number(process.env.README_SCREENSHOTS_PGPORT ?? 5432),
  pgDatabase: process.env.README_SCREENSHOTS_PGDATABASE ?? 'mathesar_django',
  pgUser: process.env.README_SCREENSHOTS_PGUSER ?? 'mathesar',
  pgPassword: process.env.README_SCREENSHOTS_PGPASSWORD ?? 'mathesar',
};

function parseArgs(argv) {
  const args = {
    ...DEFAULTS,
    reset: false,
    headed: false,
    validateOnly: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--reset') args.reset = true;
    else if (arg === '--headed') args.headed = true;
    else if (arg === '--validate-only') args.validateOnly = true;
    else if (arg === '--base-url') args.baseUrl = argv[++i];
    else if (arg === '--username') args.username = argv[++i];
    else if (arg === '--password') args.password = argv[++i];
    else if (arg === '--pg-host') args.pgHost = argv[++i];
    else if (arg === '--pg-port') args.pgPort = Number(argv[++i]);
    else if (arg === '--pg-database') args.pgDatabase = argv[++i];
    else if (arg === '--pg-user') args.pgUser = argv[++i];
    else if (arg === '--pg-password') args.pgPassword = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  args.baseUrl = args.baseUrl.replace(/\/$/, '');
  return args;
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function getCsrfToken(apiContext) {
  const state = await apiContext.storageState();
  const token = state.cookies.find((cookie) => cookie.name === 'csrftoken');
  if (!token?.value) {
    throw new Error('Unable to find Django csrftoken cookie.');
  }
  return token.value;
}

async function makeApiClient(options) {
  const apiContext = await request.newContext({
    baseURL: options.baseUrl,
    extraHTTPHeaders: {
      Accept: 'application/json, text/plain, */*',
    },
  });
  await apiContext.get('/auth/login/');
  let csrfToken = await getCsrfToken(apiContext);
  const login = await apiContext.post('/auth/login/', {
    form: {
      username: options.username,
      password: options.password,
    },
    headers: {
      Referer: `${options.baseUrl}/auth/login/`,
      'X-CSRFToken': csrfToken,
    },
  });
  if (!login.ok() && ![302, 303].includes(login.status())) {
    throw new Error(`Login failed with HTTP ${login.status()}`);
  }
  csrfToken = await getCsrfToken(apiContext);

  async function rpc(method, params = {}) {
    const response = await apiContext.post('/api/rpc/v0/', {
      data: {
        jsonrpc: '2.0',
        method,
        params,
        id: `${Date.now()}-${Math.random()}`,
      },
      headers: {
        Referer: `${options.baseUrl}/`,
        'X-CSRFToken': csrfToken,
      },
    });
    if (!response.ok()) {
      throw new Error(`${method} failed with HTTP ${response.status()}`);
    }
    const payload = await response.json();
    if (payload.error) {
      throw new Error(`${method} failed: ${payload.error.message}`);
    }
    return payload.result;
  }

  return { apiContext, rpc };
}

async function dropShowcaseDatabase(options) {
  const client = new pg.Client({
    host: options.pgHost,
    port: options.pgPort,
    database: options.pgDatabase,
    user: options.pgUser,
    password: options.pgPassword,
  });
  await client.connect();
  try {
    await client.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
      [manifest.database.name],
    );
    await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(manifest.database.name)}`);
  } finally {
    await client.end();
  }
}

async function disconnectConfiguredShowcaseDatabases(rpc) {
  const databases = await rpc('databases.configured.list');
  const matches = databases.filter(
    (database) =>
      database.name === manifest.database.name ||
      database.nickname === manifest.database.nickname,
  );
  for (const database of matches) {
    await rpc('databases.configured.disconnect', {
      database_id: database.id,
      schemas_to_remove: [],
      strict: false,
      disconnect_db_server: false,
    });
  }
}

function byName(collection, name, type) {
  const item = collection.find((entry) => entry.name === name);
  if (!item) {
    throw new Error(`Unable to find ${type} named ${name}`);
  }
  return item;
}

async function getSchemaData(rpc, databaseId) {
  const schemas = await rpc('schemas.list', { database_id: databaseId });
  const librarySchema = byName(schemas, 'Library Management', 'schema');
  const bikeSchema = byName(schemas, 'Bike Shop', 'schema');
  const movieSchema = byName(schemas, 'movie_rentals', 'schema');
  const libraryTables = await rpc('tables.list', {
    database_id: databaseId,
    schema_oid: librarySchema.oid,
  });
  const bikeTables = await rpc('tables.list', {
    database_id: databaseId,
    schema_oid: bikeSchema.oid,
  });
  const movieTables = await rpc('tables.list', {
    database_id: databaseId,
    schema_oid: movieSchema.oid,
  });
  return {
    schemas,
    librarySchema,
    bikeSchema,
    movieSchema,
    tables: {
      books: byName(libraryTables, 'Books', 'table'),
      items: byName(libraryTables, 'Items', 'table'),
      checkouts: byName(libraryTables, 'Checkouts', 'table'),
      patrons: byName(libraryTables, 'Patrons', 'table'),
      serviceRequests: byName(bikeTables, 'Service Requests', 'table'),
      movies: byName(movieTables, 'movies', 'table'),
    },
  };
}

async function getColumns(rpc, databaseId, tableOid) {
  const columns = await rpc('columns.list', {
    database_id: databaseId,
    table_oid: tableOid,
  });
  return new Map(columns.map((column) => [column.name, column]));
}

async function ensureViewerUser(rpc) {
  const viewer = manifest.supportingState.viewer;
  const users = await rpc('users.list');
  const existing = users.find(
    (user) => user.username === viewer.username || user.email === viewer.email,
  );
  if (existing) return existing;
  return rpc('users.add', {
    user_def: {
      username: viewer.username,
      password: viewer.password,
      is_superuser: false,
      email: viewer.email,
      full_name: viewer.fullName,
      display_language: 'en',
    },
  });
}

async function ensureViewerRoleAndCollaborator(rpc, database) {
  const viewerRole = manifest.supportingState.viewerRole;
  const roles = await rpc('roles.list', { database_id: database.id });
  const role =
    roles.find((candidate) => candidate.name === viewerRole.name) ??
    (await rpc('roles.add', {
      database_id: database.id,
      rolename: viewerRole.name,
      login: true,
      password: viewerRole.password,
    }));

  const configuredRoles = await rpc('roles.configured.list', {
    database_id: database.id,
    server_id: database.server_id,
  });
  const configuredRole =
    configuredRoles.find((candidate) => candidate.name === viewerRole.name) ??
    (await rpc('roles.configured.add', {
      server_id: database.server_id,
      name: viewerRole.name,
      password: viewerRole.password,
    }));

  const viewer = await ensureViewerUser(rpc);
  const collaborators = await rpc('collaborators.list', {
    database_id: database.id,
  });
  const hasCollaborator = collaborators.some(
    (collaborator) =>
      collaborator.user_id === viewer.id &&
      collaborator.configured_role_id === configuredRole.id,
  );
  if (!hasCollaborator) {
    await rpc('collaborators.add', {
      configured_role_id: configuredRole.id,
      database_id: database.id,
      user_id: viewer.id,
    });
  }
  return { role, configuredRole, viewer };
}

async function ensureReadOnlyTablePrivileges(rpc, databaseId, tableOid, roleOid) {
  await rpc('tables.privileges.replace_for_roles', {
    database_id: databaseId,
    table_oid: tableOid,
    privileges: [
      {
        role_oid: roleOid,
        direct: ['SELECT'],
      },
    ],
  });
}

async function ensureShowcaseForm(rpc, database, schemaData, configuredRole) {
  const existingForms = await rpc('forms.list', {
    database_id: database.id,
    schema_oid: schemaData.librarySchema.oid,
  });
  const existing = existingForms.find(
    (form) => form.name === manifest.supportingState.formName,
  );
  if (existing) {
    await rpc('forms.set_publish_public', {
      database_id: database.id,
      form_id: existing.id,
      publish_public: true,
    });
    return existing;
  }

  const columns = await getColumns(rpc, database.id, schemaData.tables.checkouts.oid);
  const form = await rpc('forms.add', {
    database_id: database.id,
    form_def: {
      name: manifest.supportingState.formName,
      description: 'Collect a checkout request and save it directly to PostgreSQL.',
      version: 1,
      schema_oid: schemaData.librarySchema.oid,
      base_table_oid: schemaData.tables.checkouts.oid,
      associated_role_id: configuredRole.id,
      header_title: { text: manifest.supportingState.formName },
      header_subtitle: {
        text: 'Choose the item and patron, then Mathesar creates the record.',
      },
      submit_message: { text: 'Thanks, your checkout request was saved.' },
      submit_redirect_url: null,
      submit_button_label: 'Submit request',
      fields: [
        {
          key: 'item',
          index: 0,
          label: 'Item',
          help: 'Search for the library item being checked out.',
          kind: 'foreign_key',
          column_attnum: columns.get('Item').id,
          related_table_oid: schemaData.tables.items.oid,
          fk_interaction_rule: 'must_pick',
          styling: { size: 'regular' },
          is_required: true,
          child_fields: [],
        },
        {
          key: 'patron',
          index: 1,
          label: 'Patron',
          help: 'Search for the patron checking out the item.',
          kind: 'foreign_key',
          column_attnum: columns.get('Patron').id,
          related_table_oid: schemaData.tables.patrons.oid,
          fk_interaction_rule: 'must_pick',
          styling: { size: 'regular' },
          is_required: true,
          child_fields: [],
        },
        {
          key: 'due_date',
          index: 2,
          label: 'Due date',
          help: 'Set the expected return date.',
          kind: 'scalar_column',
          column_attnum: columns.get('Due Date').id,
          styling: { size: 'regular' },
          is_required: true,
          child_fields: [],
        },
      ],
    },
  });
  await rpc('forms.set_publish_public', {
    database_id: database.id,
    form_id: form.id,
    publish_public: true,
  });
  return { ...form, publish_public: true };
}

async function ensureShowcaseExploration(rpc, database, schemaData) {
  const existingExplorations = await rpc('explorations.list', {
    database_id: database.id,
    schema_oid: schemaData.librarySchema.oid,
  });
  const existing = existingExplorations.find(
    (exploration) => exploration.name === manifest.supportingState.explorationName,
  );
  if (existing) return existing;

  const checkoutColumns = await getColumns(rpc, database.id, schemaData.tables.checkouts.oid);
  const itemColumns = await getColumns(rpc, database.id, schemaData.tables.items.oid);
  const bookColumns = await getColumns(rpc, database.id, schemaData.tables.books.oid);
  const initialColumns = [
    {
      alias: 'checkout_time',
      attnum: checkoutColumns.get('Checkout Time').id,
    },
    {
      alias: 'due_date',
      attnum: checkoutColumns.get('Due Date').id,
    },
    {
      alias: 'item_barcode',
      attnum: itemColumns.get('Barcode').id,
      join_path: [
        [
          [schemaData.tables.checkouts.oid, checkoutColumns.get('Item').id],
          [schemaData.tables.items.oid, itemColumns.get('id').id],
        ],
      ],
    },
    {
      alias: 'book_title',
      attnum: bookColumns.get('Title').id,
      join_path: [
        [
          [schemaData.tables.checkouts.oid, checkoutColumns.get('Item').id],
          [schemaData.tables.items.oid, itemColumns.get('id').id],
        ],
        [
          [schemaData.tables.items.oid, itemColumns.get('Book').id],
          [schemaData.tables.books.oid, bookColumns.get('id').id],
        ],
      ],
    },
  ];
  return rpc('explorations.add', {
    database_id: database.id,
    exploration_def: {
      database_id: database.id,
      schema_oid: schemaData.librarySchema.oid,
      base_table_oid: schemaData.tables.checkouts.oid,
      name: manifest.supportingState.explorationName,
      description: 'Library checkout records joined to item and book details.',
      initial_columns: initialColumns,
      transformations: [
        {
          type: 'filter',
          spec: {
            not_null: [{ column_name: ['book_title'] }],
          },
        },
        {
          type: 'order',
          spec: [{ field: 'checkout_time', direction: 'desc' }],
        },
      ],
      display_options: null,
      display_names: {
        checkout_time: 'Checkout time',
        due_date: 'Due date',
        item_barcode: 'Item barcode',
        book_title: 'Book title',
      },
    },
  });
}

async function setupShowcaseData(options, rpc) {
  if (options.reset) {
    await disconnectConfiguredShowcaseDatabases(rpc);
    await dropShowcaseDatabase(options);
  }
  let databases = await rpc('databases.configured.list');
  let database = databases.find(
    (candidate) =>
      candidate.name === manifest.database.name ||
      candidate.nickname === manifest.database.nickname,
  );
  if (!database) {
    const result = await rpc('databases.setup.create_new', {
      database: manifest.database.name,
      nickname: manifest.database.nickname,
      sample_data: manifest.database.sampleData,
    });
    database = result.database;
  }
  const schemaData = await getSchemaData(rpc, database.id);
  const collaboratorState = await ensureViewerRoleAndCollaborator(rpc, database);
  await ensureReadOnlyTablePrivileges(
    rpc,
    database.id,
    schemaData.tables.books.oid,
    collaboratorState.role.oid,
  );
  const form = await ensureShowcaseForm(
    rpc,
    database,
    schemaData,
    collaboratorState.configuredRole,
  );
  const exploration = await ensureShowcaseExploration(rpc, database, schemaData);
  return {
    database,
    schemaData,
    collaboratorState,
    form,
    exploration,
  };
}

async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
}

async function goto(page, pathOrUrl) {
  await page.goto(pathOrUrl.startsWith('http') ? pathOrUrl : pathOrUrl, {
    waitUntil: 'domcontentloaded',
  });
  await waitForApp(page);
}

async function clickFirstVisible(page, locators) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = locator.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        await waitForApp(page);
        return true;
      }
    }
  }
  return false;
}

async function fillFirstVisible(page, locators, value) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = locator.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        const filled = await candidate.fill(value).then(
          () => true,
          () => false,
        );
        if (filled) {
          await waitForApp(page);
          return true;
        }
      }
    }
  }
  return false;
}

async function checkFirstVisible(page, locators) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = locator.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.check({ force: true }).catch(async () => {
          await candidate.click({ force: true });
        });
        await waitForApp(page);
        return true;
      }
    }
  }
  return false;
}

async function openCreateDatabaseDialog(page) {
  await goto(page, '/');
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /connect/i }),
    page.getByRole('button', { name: /create/i }),
    page.getByRole('link', { name: /create/i }),
    page.getByText(/connect database/i),
    page.getByText(/create database/i),
  ]);
  await clickFirstVisible(page, [
    page.getByRole('button').filter({ hasText: /connect to an existing database/i }),
    page.locator('.connect-option button').filter({ hasText: /connect to an existing database/i }),
    page.getByText(/connect to an existing database/i),
  ]);
  await fillFirstVisible(page, [
    page.getByLabel(/host/i),
    page.locator('input[type="text"]').nth(0),
  ], 'db');
  await fillFirstVisible(page, [
    page.getByLabel(/database name/i),
    page.locator('input[type="text"]').nth(1),
  ], manifest.database.name);
  await fillFirstVisible(page, [
    page.getByLabel(/role name/i),
    page.locator('input[type="text"]').nth(2),
  ], 'mathesar');
  await fillFirstVisible(page, [
    page.getByLabel(/password/i),
    page.locator('input[type="password"]').nth(0),
  ], 'password');
  await clickFirstVisible(page, [
    page.getByLabel(/custom nickname/i),
    page.getByText(/custom nickname/i),
  ]);
  await fillFirstVisible(page, [
    page.getByLabel(/^nickname$/i),
    page.locator('input[type="text"]').last(),
  ], manifest.database.nickname);
  await checkFirstVisible(page, [
    page.getByRole('checkbox', { name: /bike shop/i }),
    page.getByLabel(/bike shop/i),
  ]);
  await checkFirstVisible(page, [
    page.getByRole('checkbox', { name: /movie rentals/i }),
    page.getByLabel(/movie rentals/i),
  ]);
  await page.waitForTimeout(500);
}

async function openInspector(page) {
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /inspector/i }),
    page.getByRole('button', { name: /details/i }),
    page.locator('[aria-label*="Inspector" i]'),
    page.locator('[title*="Inspector" i]'),
  ]);
}

async function openRecordSelector(page) {
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /pick record/i }),
    page.locator('button.dropdown-button[aria-label*="Pick" i]'),
  ]);
  await page.locator('.modal-record-selector, .record-selector-window').first()
    .waitFor({ state: 'visible', timeout: 5000 })
    .catch(async () => {
      await clickFirstVisible(page, [
        page.getByRole('gridcell', { name: /.+/ }).nth(4),
        page.locator('[role="gridcell"]').nth(4),
        page.locator('td').nth(4),
      ]);
      await page.keyboard.press('Enter').catch(() => {});
      await page.locator('.modal-record-selector, .record-selector-window').first()
        .waitFor({ state: 'visible', timeout: 5000 });
    });
  await page.waitForTimeout(500);
}

async function openRelationshipCreation(page) {
  await openInspector(page);
  await clickFirstVisible(page, [
    page.getByRole('tab', { name: /^table$/i }),
    page.getByRole('button', { name: /^table$/i }),
  ]);
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /create relationship/i }),
    page.locator('button').filter({ hasText: /create relationship/i }),
  ]);
  await page.getByText(/create relationship/i).first().waitFor({ state: 'visible' });
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /select table/i }),
    page.getByRole('combobox'),
    page.locator('.select button, button.dropdown.trigger').filter({ hasText: /select/i }),
  ]);
  await clickFirstVisible(page, [
    page.getByRole('option', { name: /patrons/i }),
    page.getByRole('menuitem', { name: /patrons/i }),
    page.getByText(/^Patrons$/i),
  ]);
  await page.waitForTimeout(500);
}

async function openPermissionsDialog(page) {
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /permission/i }),
    page.getByRole('link', { name: /permission/i }),
    page.getByText(/permissions/i),
  ]);
}

async function openAddCollaboratorDialog(page) {
  await clickFirstVisible(page, [
    page.getByRole('button', { name: /add collaborator/i }),
    page.locator('button').filter({ hasText: /add collaborator/i }),
  ]);
  await page.getByText(/^add collaborator$/i).first()
    .waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);
}

async function openDisconnectDialog(page) {
  const openedDirectly = await clickFirstVisible(page, [
    page.getByRole('button', { name: /disconnect/i }),
    page.getByRole('link', { name: /disconnect/i }),
    page.getByText(/disconnect database/i),
  ]);
  if (!openedDirectly) {
    await clickFirstVisible(page, [
      page.locator('.database-page-header button.dropdown.trigger.no-arrow'),
      page.locator('.database-page-header button[aria-haspopup="listbox"]'),
      page.locator('.database-page-header .dropdown-container button'),
    ]);
    await clickFirstVisible(page, [
      page.getByRole('menuitem', { name: /disconnect database/i }),
      page.locator('button[role="menuitem"]').filter({ hasText: /disconnect database/i }),
      page.getByText(/disconnect database/i),
    ]);
  }
  await page.getByText(/disconnect .* database/i).first()
    .waitFor({ state: 'visible', timeout: 5000 });
}

async function openExplorationBuilderState(page) {
  await clickFirstVisible(page, [
    page.getByRole('tab', { name: /transform results/i }),
    page.getByRole('button', { name: /transform results/i }),
    page.getByText(/transform results/i),
  ]);
  await page.waitForTimeout(500);
}

function routes(state) {
  const { database, schemaData, form, exploration } = state;
  const schemaBase = `/db/${database.id}/schemas/${schemaData.librarySchema.oid}`;
  return {
    databaseHome: `/db/${database.id}/schemas/`,
    collaborators: `/db/${database.id}/settings/collaborators/`,
    schema: `${schemaBase}/`,
    booksTable: `${schemaBase}/tables/${schemaData.tables.books.oid}/`,
    itemsTable: `${schemaBase}/tables/${schemaData.tables.items.oid}/`,
    recordPage: `${schemaBase}/tables/${schemaData.tables.items.oid}/1`,
    formBuilder: `${schemaBase}/forms/${form.id}/`,
    publicForm: `/shares/forms/${form.token}/`,
    exploration: `${schemaBase}/explorations/${exploration.id}/`,
    settings: `/db/${database.id}/settings/`,
  };
}

async function prepareCapture(page, capture, state) {
  const r = routes(state);
  switch (capture.id) {
    case 'connect-db':
      await openCreateDatabaseDialog(page);
      break;
    case 'add-collaborator':
      await goto(page, r.collaborators);
      await openAddCollaboratorDialog(page);
      break;
    case 'schema-page':
      await goto(page, r.schema);
      break;
    case 'table-inspector':
      await goto(page, r.booksTable);
      await openInspector(page);
      break;
    case 'record-selector':
      await goto(page, r.itemsTable);
      await openRecordSelector(page);
      break;
    case 'relationship-creation':
      await goto(page, r.booksTable);
      await openRelationshipCreation(page);
      break;
    case 'table-permissions':
      await goto(page, r.booksTable);
      await openPermissionsDialog(page);
      break;
    case 'record-page':
      await goto(page, r.recordPage);
      break;
    case 'form-builder':
      await goto(page, r.formBuilder);
      break;
    case 'form-fill-example':
      await goto(page, r.publicForm);
      break;
    case 'viewing-exploration':
      await goto(page, r.exploration);
      break;
    case 'building-exploration':
      await goto(page, r.exploration);
      await openExplorationBuilderState(page);
      break;
    case 'disconnect-db':
      await goto(page, r.settings);
      await openDisconnectDialog(page);
      break;
    default:
      throw new Error(`No capture preparation defined for ${capture.id}`);
  }
  await waitForApp(page);
}

async function capturePage(page, capture) {
  const outPath = path.join(outputDir, capture.filename);
  const captureSpecificStyle = capture.id === 'connect-db'
    ? `
      .databases-list-grid .db-card-content .name-and-detail,
      .databases-list-grid .db-card-content .detail,
      .databases-list-grid .db-card-content .display-name {
        visibility: hidden !important;
      }
      .databases-list-grid .db-card-content {
        background: var(--color-bg-raised-1) !important;
      }
    `
    : '';
  await page.screenshot({
    path: outPath,
    fullPage: false,
    animations: 'disabled',
    caret: 'hide',
    style: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      [data-testid*="toast" i],
      [class*="toast" i],
      [class*="notification" i] {
        display: none !important;
      }
      ${captureSpecificStyle}
    `,
  });
  const metadata = await sharp(outPath).metadata();
  const screenshotWidth = metadata.width ?? 0;
  const screenshotHeight = metadata.height ?? 0;
  const frameSvg = Buffer.from(`
    <svg width="${screenshotWidth}" height="${screenshotHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${screenshotWidth - 2}" height="${screenshotHeight - 2}" fill="none" stroke="#24292f" stroke-width="2" />
    </svg>
  `);
  await sharp(outPath)
    .composite([{ input: frameSvg }])
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
    .toBuffer()
    .then((buffer) => fs.writeFile(outPath, buffer));
}

async function validateScreenshots() {
  const failures = [];
  for (const capture of manifest.captures) {
    const filePath = path.join(outputDir, capture.filename);
    try {
      const metadata = await sharp(filePath).metadata();
      if (metadata.format !== 'png') {
        failures.push(`${capture.filename}: expected PNG, got ${metadata.format}`);
      }
      if (!metadata.width || !metadata.height) {
        failures.push(`${capture.filename}: missing dimensions`);
      }
      if ((metadata.width ?? 0) < 900 || (metadata.height ?? 0) < 500) {
        failures.push(
          `${capture.filename}: unexpectedly small (${metadata.width}x${metadata.height})`,
        );
      }
    } catch (error) {
      failures.push(`${capture.filename}: ${error.message}`);
    }
  }
  if (failures.length) {
    throw new Error(`Screenshot validation failed:\n${failures.join('\n')}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await ensureDirectory(outputDir);
  if (options.validateOnly) {
    await validateScreenshots();
    console.log(`Validated ${manifest.captures.length} README screenshots.`);
    return;
  }

  const { apiContext, rpc } = await makeApiClient(options);
  let browser;
  try {
    const state = await setupShowcaseData(options, rpc);
    browser = await chromium.launch({ headless: !options.headed });
    const context = await browser.newContext({
      baseURL: options.baseUrl,
      viewport: {
        width: manifest.viewport.width,
        height: manifest.viewport.height,
      },
      deviceScaleFactor: manifest.viewport.deviceScaleFactor,
      colorScheme: 'light',
      locale: 'en-US',
      timezoneId: 'UTC',
      storageState: await apiContext.storageState(),
    });
    const page = await context.newPage();
    for (const capture of manifest.captures) {
      console.log(`Capturing ${capture.filename}: ${capture.heading}`);
      await prepareCapture(page, capture, state);
      await capturePage(page, capture);
    }
    await validateScreenshots();
    console.log(`Wrote ${manifest.captures.length} screenshots to ${path.relative(repoRoot, outputDir)}`);
  } finally {
    await browser?.close();
    await apiContext.dispose();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
