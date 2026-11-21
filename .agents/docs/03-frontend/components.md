# Components, systems, and styling

This file is a map of the UI building blocks: the generic component library, the shared Mathesar components, the feature systems, the wiring that picks a cell or input component for each data type, icons, styling and theming, and the overlay patterns (modals, toasts, confirmations).
Read it before building UI, so that you reuse what exists and place new code correctly.

## Component library

`mathesar_ui/src/component-library/` is a generic UI kit with no Mathesar concepts. Its rules are in `mathesar_ui/src/component-library/README.md`: no imports from outside the directory, no dependence on outside styles, global styles with static class names.

How it is organized:

- One kebab-case folder per component. Inside: a PascalCase Svelte file, usually an SCSS file of the same name, sometimes controllers or utils, and a folder named `__meta__` or `__tests__` for tests. Example: `mathesar_ui/src/component-library/button/`.
- Styles are global SCSS files. Each one is imported by `mathesar_ui/src/component-library/styles.scss`, which `mathesar_ui/src/App.svelte` imports once. Only 18 of about 130 library components carry a `<style>` block.
- Public exports are in `mathesar_ui/src/component-library/index.ts`. Public types are in `mathesar_ui/src/component-library/types.ts`.
- Inside the library, import with `@mathesar-component-library-dir/...` or relative paths.
- The library is exempt from the raw-text lint rule and contains hard-coded English (for example the default confirmation labels). It has no i18n context yet.
- `*.stories.svelte` and `*.mdx` files in the `__meta__` folders are leftovers from Storybook, which is no longer installed. ESLint and `mathesar_ui/tsconfig.json` exclude the stories.

To add a library component: create the folder, write the component, add its SCSS import to `mathesar_ui/src/component-library/styles.scss`, export it from `mathesar_ui/src/component-library/index.ts`, and add a test in its `__meta__` folder.

What it offers (check the library index file before writing a new widget):

| Group | Exports |
|---|---|
| Buttons and links | `Button`, `AnchorButton`, `SpinnerButton`, `CancelOrProceedButtonPair` |
| Inputs | `TextInput`, `TextArea`, `NumberInput`, `PasswordInput`, `Checkbox`, `Radio`, `RadioGroup`, `CheckboxGroup`, `Select`, `MultiSelect`, `ListBox`, `DatePicker`, `FileUpload`, `FormattedInput`, `LabeledInput`, `Fieldset`, `InputGroup` |
| Overlays | `Dropdown`, `AttachableDropdown`, `DropdownMenu`, `Menu` items (`ButtonMenuItem`, `LinkMenuItem`, `MenuDivider`, `MenuHeading`), `ContextMenu`, `ControlledModal`, `Tooltip`, `Help`, `Window` |
| Feedback | `ToastPresenter` and `makeToast`, `Confirmation` and `makeConfirm`, `Spinner`, `SpinnerArea`, `Skeleton`, `Progress`, `Notification` |
| Layout | `TabContainer`, `Collapsible`, `WithPanel` (resizable side panel), `Truncate`, `Pagination` |
| Rendering helpers | `Icon`, `Render`, `StringOrComponent`, `FormBuilder` (form from a JSON-like config) |
| Actions | `popper`, `portal`, `clickOffBounds`, `focusTrap`, `slider`, `tooltipAction` |
| Utilities | `CancellablePromise`, `ImmutableMap`, `ImmutableSet`, `WritableMap`, `WritableSet`, `EventHandler`, store helpers, type guards such as `hasProperty`, `isDefinedNonNullable`, `assertExhaustive` |

## Shared components in `mathesar_ui/src/components/`

| Path | What it does | Used by |
|---|---|---|
| `mathesar_ui/src/components/sheet/` | The spreadsheet grid: `Sheet`, header, rows, virtual scrolling, column resizing, cell selection (`mathesar_ui/src/components/sheet/selection/`), copy and paste (`mathesar_ui/src/components/sheet/clipboard/`), keyboard movement. Knows nothing about tables or queries. | Table view, Data Explorer results, column extraction modal |
| `mathesar_ui/src/components/cell-fabric/` | Renders the right cell or input for a column's data type. `CellFabric` for cells, `DynamicInput` for inputs. | Every sheet, record page, record selector, filters, forms, import preview |
| `mathesar_ui/src/components/abstract-type-control/` | UI to pick a column's type and edit its database options and display options. | Column inspector, new column dropdown, import preview |
| `mathesar_ui/src/components/form/` | Form library: `makeForm`, `requiredField`, `optionalField`, validators, `Field`, `FieldLayout`, `FormSubmit`. | Most modals and settings pages |
| `mathesar_ui/src/components/filter/` | Nested filter builder (groups and conditions) with drag and drop. | Table filter dropdown, Data Explorer filter step |
| `mathesar_ui/src/components/sort-entry/`, `mathesar_ui/src/components/group-entry/` | One row of the sort and group editors. | Table view and Data Explorer |
| `mathesar_ui/src/components/inspector/cell/CellInspector.svelte` | Read-only view of the active cell value. | Table inspector and exploration inspector |
| `mathesar_ui/src/components/InspectorSection.svelte`, `mathesar_ui/src/components/InspectorTabContent.svelte` | Layout pieces for right-hand inspector panels. | Table, exploration and form inspectors |
| `mathesar_ui/src/components/grid-table/` | CSS grid table wrapper (`GridTable`, `GridTableCell`). | Roles, collaborators, role configuration pages |
| `mathesar_ui/src/components/grid-form/` | Two-column label and input grid for forms. | User form, exploration inspector, constraint forms |
| `mathesar_ui/src/components/breadcrumb/` | Header breadcrumb, entity switchers, `AppendBreadcrumb`. | Route components, `AppHeader` |
| `mathesar_ui/src/components/routing/` | tinro helpers. See `.agents/docs/03-frontend/routing-pages.md`. | Route components |
| `mathesar_ui/src/components/rich-text/` | `RichText`: renders a translated string that contains component slots. | Anywhere a translated sentence embeds a component |
| `mathesar_ui/src/components/errors/` | The `Errors` component and error-code mapping. | Pages and panels that show load errors |
| `mathesar_ui/src/components/message-boxes/` | `InfoBox`, `WarningBox`, `ErrorBox`, `OutcomeBox`. | Everywhere |
| `mathesar_ui/src/components/file-attachments/` | File cell content, lightbox, detail dropdown, upload modal, with their controllers. | File cells and form file fields |
| `mathesar_ui/src/components/drag-and-drop/`, `mathesar_ui/src/components/sortable/` | Two drag-and-drop helpers. `mathesar_ui/src/components/drag-and-drop/dnd.ts` serves the filter builder. `mathesar_ui/src/components/sortable/sortable.ts` (see `mathesar_ui/src/components/sortable/README.md`) serves vertical list sorting. | Filters, form fields, record summary template |
| `mathesar_ui/src/components/select-new-pk-column-type/` | Choice between identity and UUID primary key. | Table creation form |
| `mathesar_ui/src/components/mini-pagination/`, `mathesar_ui/src/components/PaginationGroup.svelte` | Pagination controls. | Sheets and lists |
| `mathesar_ui/src/components/resources/` | Cards linking to docs, community, donation, mailing list. | Home page |

Single-file components at the top of the folder cover names and identifiers (`mathesar_ui/src/components/TableName.svelte`, `mathesar_ui/src/components/Identifier.svelte`, `mathesar_ui/src/components/NameWithIcon.svelte`), entity pickers (`mathesar_ui/src/components/SelectTable.svelte`, `mathesar_ui/src/components/SelectProcessedColumn.svelte`), the app header (`mathesar_ui/src/components/AppHeader.svelte`), record links (`mathesar_ui/src/components/LinkedRecord.svelte`, `mathesar_ui/src/components/RecordHyperlink.svelte`) and small display atoms (`mathesar_ui/src/components/Null.svelte`, `mathesar_ui/src/components/CellValue.svelte`).

`mathesar_ui/src/components/Form.svelte` and `mathesar_ui/src/components/FormField.svelte` are layout wrappers used in two places. They are not the form library.

## Systems in `mathesar_ui/src/systems/`

| System | What it is |
|---|---|
| `mathesar_ui/src/systems/table-view/` | The table sheet: header cells, rows, actions pane (filter, sort, group, hide, join), table inspector (table, column, record and cell tabs), constraints modal, link-table modal, import into an existing table, context menu entries. Reads `TabularData` from context. The largest system (about 130 files). |
| `mathesar_ui/src/systems/data-explorer/` | Query builder. `QueryModel` (immutable query), `QueryRunner` (runs and paginates), `QueryManager` (adds editing, saving, input columns). Input sidebar, result pane, exploration inspector. |
| `mathesar_ui/src/systems/data-forms/` | Form builder and form filler. `mathesar_ui/src/systems/data-forms/form-maker/data-form-utilities/` holds the structure and field classes. `mathesar_ui/src/systems/data-forms/add-edit-modal/` creates forms. |
| `mathesar_ui/src/systems/record-view/` | Record page content: `RecordStore`, direct fields, and `TableWidget` sheets for related tables. |
| `mathesar_ui/src/systems/record-view-modal/` | The record view inside a modal. `WithModalRecordView` provides the modal controller through context. |
| `mathesar_ui/src/systems/record-selector/` | Full-screen modal to pick a record of a table by searching columns. Nested selectors are supported. One root instance is mounted in `mathesar_ui/src/AppContext.svelte`. |
| `mathesar_ui/src/systems/row-seeker/` | Lightweight dropdown record picker attached to an element. |
| `mathesar_ui/src/systems/multi-tagger/` | Dropdown to add and remove links in a many-to-many join cell. |
| `mathesar_ui/src/systems/record-selection-orchestrator/` | The interface that lets foreign key inputs use the record selector or the row seeker without depending on either. Read the file comments. |
| `mathesar_ui/src/systems/permissions/` | Generic permissions modal (owner, role access levels, transfer ownership). Used for databases, schemas and tables. |
| `mathesar_ui/src/systems/databases/` | Connect, create, edit and upgrade database modals. |
| `mathesar_ui/src/systems/schemas/` | Add and edit schema modal. |
| `mathesar_ui/src/systems/users/` | User details form, password form, display language select. |
| `mathesar_ui/src/systems/feedback/` | Feedback dropdown in the header. |

## How data-type-specific cells and inputs are wired

A chain of lookups decides how a column renders.

1. Abstract type: `getAbstractTypeForDbType(dbType, metadata)` in `mathesar_ui/src/stores/abstract-types/abstractTypeCategories.ts` maps a PostgreSQL type name to a Mathesar UI type.
   - The mapping table (`typesResponse`) is hard-coded in that file. Type name constants are in `mathesar_ui/src/stores/abstract-types/dbTypes.ts`.
   - Two types depend on column metadata instead of the DB type alone. "File" is `jsonb` with `metadata.file_backend`. "User" is `integer` with `metadata.user_display_field`.
   - Unknown DB types fall back to the "Other" type (`mathesar_ui/src/stores/abstract-types/type-configs/fallback.ts`).
2. Abstract type config: one file per type in `mathesar_ui/src/stores/abstract-types/type-configs/`. It provides `getIcon`, `cellInfo`, and optionally `getDbConfig` (form for type options such as precision), `getDisplayConfig` (form for display options stored in column metadata), and `defaultDbType`.
3. Cell data type: `cellInfo.type` names a `CellComponentFactory` registered in `mathesar_ui/src/components/cell-fabric/data-types/index.ts` (`string`, `boolean`, `number`, `money`, `uri`, `duration`, `date`, `time`, `datetime`, `file`, `user`, `enum`, `array`). Several abstract types share one factory.
4. Factory methods (interface in `mathesar_ui/src/components/cell-fabric/data-types/typeDefinitions.ts`):
   - `get`: component and props for a sheet cell.
   - `getInput`: input for data entry outside the sheet (record page, default value, forms).
   - `getSimpleInput`: optional input for filters and search boxes.
   - `getDisplayFormatter`: value to string, for copy, group headers and summaries.
5. `ProcessedColumn` (`mathesar_ui/src/stores/table-data/processedColumns.ts`) calls the helpers in `mathesar_ui/src/components/cell-fabric/utils.ts` once per column and stores the results as `cellComponentAndProps`, `inputComponentAndProps`, `simpleInputComponentAndProps` and `formatCellValue`.
   - Foreign key columns get `LinkedRecordCell` and `LinkedRecordInput` regardless of type.
   - Primary key columns get `PrimaryKeyCell`.
   - Joined many-to-many columns get `SimpleManyToManyJoinCell`.
6. `mathesar_ui/src/components/cell-fabric/CellFabric.svelte` renders `columnFabric.cellComponentAndProps` with `<svelte:component>`. `mathesar_ui/src/components/cell-fabric/DynamicInput.svelte` does the same for an input.

Cell components live in `mathesar_ui/src/components/cell-fabric/data-types/components/`. Most editable cells build on `SteppedInputCell` and `CellWrapper` in that folder.

Per-type behavior outside rendering:

| Concern | File |
|---|---|
| Filter conditions offered per type | `mathesar_ui/src/stores/abstract-types/operations/filtering.ts` |
| Grouping preprocessing functions | `mathesar_ui/src/stores/abstract-types/operations/preprocFunctions.ts` |
| Data Explorer summarization functions | `mathesar_ui/src/stores/abstract-types/operations/summarization.ts` |
| Allowed type changes | `mathesar_ui/src/stores/abstract-types/typeCastMap.ts` |
| Display option types and defaults | `mathesar_ui/src/api/rpc/_common/columnDisplayOptions.ts` |

To change how a type renders, edit its factory in `mathesar_ui/src/components/cell-fabric/data-types/`. To add a display option, extend `RequiredColumnMetadata` and its defaults, the type config form, and the factory that reads it. The backend must accept the new metadata key.
Labels in the type config forms are plain English strings in `.ts` files. They are not in the translation dictionary.

## Icons

`mathesar_ui/ARCHITECTURE.md` covers icon storage and naming. In short:

- Render with `<Icon {...iconName} />` from the component library.
- App icons are constants in `mathesar_ui/src/icons/index.ts`, named by meaning (`iconDeleteMajor`, `iconTable`), built from `@fortawesome/free-solid-svg-icons` or from paths in `mathesar_ui/src/icons/customIcons.ts`.
- Generic icons (`iconClose`, `iconLoading`, `iconSearch`) are in `mathesar_ui/src/component-library/common/icons.ts`. Reuse them before adding an app icon.
- Outside the component library, only `mathesar_ui/src/icons/index.ts` imports from Font Awesome. Keep it that way.

## Styling

Rules on units, spacing, margins and z-index are in `mathesar_ui/STANDARDS.md`. Facts about the implementation:

- Components use `<style lang="scss">` or plain `<style>`. Svelte scopes these styles. Use `:global(...)` to reach into child components.
- Global styles and app-level CSS variables are in the `<style global>` block of `mathesar_ui/src/App.svelte` (page padding, layout widths, cell colors, z-index layers, headings).
- Design tokens are CSS variables on `body`:

| Token family | Examples | Defined in |
|---|---|---|
| Colors by role | `--color-bg-base`, `--color-bg-raised-1`, `--color-bg-input`, `--color-fg-base`, `--color-fg-subtle-1`, `--color-fg-link`, `--color-border-base`, `--color-border-grid`, `--color-bg-danger`, `--color-fg-danger` | `mathesar_ui/src/component-library/common/styles/themes/light/` and `mathesar_ui/src/component-library/common/styles/themes/dark/` |
| Product colors | `--color-schema`, `--color-database`, `--color-table`, `--color-record`, `--color-exploration`, `--color-data-form` | `mathesar_ui/src/App.svelte` |
| Brand and utility colors | `--color-brand`, `--color-navigation`, `--color-action-primary` | `mathesar_ui/src/component-library/common/styles/themes/colors.scss` |
| Sizes | `--sm6` to `--sm1`, `--lg1` to `--lg5` | `mathesar_ui/src/component-library/common/styles/variables.scss` |
| Radius and weights | `--border-radius-m`, `--font-weight-medium` | same file |

- Component-specific knobs are CSS variables named `--ComponentName__property`, for example `--WithPanel__gap` and `--MessageBox__margin`. A parent sets them to adjust a child. Pass layout variables through the `cssVariables` prop of `mathesar_ui/src/layouts/LayoutWithHeader.svelte`.
- Theming: `mathesar_ui/src/component-library/common/styles/themes/main.scss` emits light tokens on `body` and dark tokens on `body.theme-dark`. `initUiTheme()` in `mathesar_ui/src/utils/uiThemePreference.ts` sets the `theme-light` or `theme-dark` class from the `uiThemePreference` localStorage store (`light`, `dark` or `system`). The switch is `mathesar_ui/src/components/UiThemeSelect.svelte`.
- Use color tokens, never literal colors, so both themes work. Mix with `color-mix(in srgb, var(--token), transparent N%)` as existing code does.
- The server-rendered login pages share the tokens. `mathesar/templates/mathesar/app_styled_base.html` loads the library stylesheet.

## Modals, toasts, confirmations, menus

| Need | Pattern |
|---|---|
| Modal | `const controller = modal.spawnModalController();` with `modal` from `mathesar_ui/src/stores/modal.ts`. Render `<ControlledModal {controller}>` (or a component wrapping it) in the same component. Call `controller.open()` and `controller.close()`. A controller can carry options: `spawnModalController<Options>()` and `open(options)`. Modals stack, and `isOnTop` tells a modal whether it is the top one. |
| Toast | `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`, `toast.fromError(e)`, `toast.spinner(...)`, `toast.progress(...)` with `toast` from `mathesar_ui/src/stores/toast.ts`. The single `ToastPresenter` is mounted in `mathesar_ui/src/AppContext.svelte`. |
| Confirmation | `await confirm({ title, body, proceedButton, onProceed })` or `await confirmDelete({ identifierType, identifierName, onProceed })` from `mathesar_ui/src/stores/confirmation.ts`. The promise resolves to a boolean. The dialog stays open while `onProceed` runs. Errors go to `onError`. |
| Context menu | Get the controller with `contextMenuContext.get()` from `mathesar_ui/src/contexts/contextMenuContext.ts`. The table view builds its entries in `mathesar_ui/src/systems/table-view/context-menu/`. |
| Dropdown menu | `DropdownMenu` with menu items from the component library. `AttachableDropdown` attaches a dropdown to an arbitrary element. |
| Pick a record | `recordSelectorContext` (`mathesar_ui/src/systems/record-selector/RecordSelectorController.ts`) and `acquireUserInput({ tableOid })`, or the row seeker through `rowSeekerContext`. |
| App-wide overlay with a controller | Follow the existing pattern: controller class with stores, `makeContext()` export, one instance and one component mounted in `mathesar_ui/src/AppContext.svelte`. |

Forms inside modals use the form library:

```ts
const name = requiredField('');
const form = makeForm({ name });
// markup: <Field field={name} label={$_('name')} /> ... <FormSubmit {form} onProceed={save} onCancel={close} />
```

`makeForm`, `requiredField`, `optionalField`, the validators and the components are exported from `mathesar_ui/src/components/form/index.ts`. `mathesar_ui/ARCHITECTURE.md` links to the design notes.
