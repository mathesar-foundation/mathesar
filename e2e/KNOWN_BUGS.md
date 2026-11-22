# Known bugs

Behaviour that is wrong today and that the suite asserts as it is. `README.md` explains why and how to retire an entry.

Each entry names its tests: the pinned test (tag `@known-bug`) and the `test.fixme` that asserts the correct behaviour, or none for a race that no test can bring about. `(intermittent)` after an id marks a bug that depends on timing, `(Firefox)` or `(WebKit)` a bug of that browser only. A **Browsers** line says where a bug happens when that is not every browser.

## Table page

### sheet-shift-click-row-number

- **Steps:** Click the row number of a record. Shift-click the row number of another record.
- **Current:** Only the cells of the first column are selected in the rows in between.
- **Correct:** All cells of those rows are selected, as a drag across the row numbers does and as a shift-click on a column header does for columns.
- **Tests:** `tests/table/selection.spec.ts`

### sheet-keyboard-navigation-stops-on-scroll (intermittent)

- **Steps:** Open a table with more records than fit on the screen. Click a cell near the top. Press ArrowDown until the active cell reaches the lower edge.
- **Current:** On most loads, the rows are rendered again shortly after the first scroll of the sheet, and the keyboard focus moves to the page body. Further key presses scroll the sheet and no longer move the active cell. This happens when the records of the table arrived after its columns and constraints, which is the usual order. Otherwise the rows are rendered again when loading ends (see `sheet-initial-focus`) and navigation goes on. Navigation to the right in a wide table is not affected.
- **Correct:** The active cell keeps moving, stays focused and is scrolled into view.
- **Tests:** `tests/table/scrolling.spec.ts`. They hold the records until the columns and constraints have arrived.

### sheet-initial-focus (intermittent)

- **Steps:** Open a table page. Press an arrow key without clicking anything.
- **Current:** The first cell is marked active. The page asks for the records a second time as soon as the first answer arrives. When the columns of the table arrive between the two answers, the rows are rendered again right after the first cell got the focus, the focus moves to the page body, and the keys do nothing until a cell is clicked. In the usual order of the answers the cell keeps the focus.
- **Correct:** The first cell has the keyboard focus on every load.
- **Tests:** `tests/table/selection.spec.ts`. They hold the columns until the first answer of the records has arrived, and the second answer until the rows are shown.

### sheet-new-record-from-row-number-focus

- **Steps:** Click the number cell (the plus sign) of the empty last row. Press an arrow key.
- **Current:** A record is started and its first editable cell is marked active, but the keyboard focus is on the rows area of the sheet. The arrow key does nothing until a cell is clicked. New Record in the status bar focuses the new cell.
- **Correct:** The new cell has the keyboard focus, as after New Record.
- **Browsers:** In Firefox and WebKit, the keyboard focus is on the page itself, outside the sheet. The arrow key does nothing there either.
- **Tests:** `tests/table/records.spec.ts`

### sheet-selection-while-loading

- **Steps:** Open a table on a slow connection. While the status bar still says Loading, click a cell.
- **Current:** The clicked cell becomes active. When the columns, the constraints and the records have all arrived, the first cell becomes active and the click is lost. The page asks for the records once more when the first records arrive, so it stays in this state for one more request.
- **Correct:** A cell that the user selects while the table loads stays selected.
- **Tests:** `tests/table/selection.spec.ts`

### inspector-open-record-with-several-records

- **Steps:** Select several records, for example by dragging across row numbers. Look at the Record tab of the inspector.
- **Current:** The tab still offers "Quick View Record" and "Open Record". The link of "Open Record" ends in `/undefined`.
- **Correct:** The actions that work on one record are not offered while several records are selected.
- **Tests:** `tests/table/inspector-sync.spec.ts`

### copy-escapes-negative-number-with-separator

- **Steps:** In a number column, copy a cell that holds -1234, shown as "-1,234".
- **Current:** The clipboard text is `"'-1,234"`: the copy escapes it like a formula, so a spreadsheet reads it as text. -5 is copied as `-5`. The pattern in `tsv.ts` that exempts negative numbers accepts digits only, not the grouping separator of the shown value.
- **Correct:** `-1,234`, as shown, like every negative number. The code means to exempt negative numbers (issue 3576).
- **Tests:** `tests/table/clipboard.spec.ts`

### paste-date-time-ignores-date-format

- **Steps:** Give a date-time column the date format "DD/MM/YYYY". Paste the text `03/04/2024 13:45` into one of its cells.
- **Current:** PostgreSQL reads the text month first and stores 4 March 2024, which the cell shows as "04/03/2024 13:45". `paste.ts` compares the type of the column with `timestamp`, `timestamptz` and `time`, but the API names these types `timestamp without time zone`, `timestamp with time zone` and `time without time zone`. So only date columns read pasted text in their own format.
- **Correct:** The text is read in the date format of the column, as `paste.ts` means to: 3 April 2024.
- **Tests:** `tests/table/clipboard.spec.ts`

### paste-drops-leading-empty-field

- **Steps:** Put text whose first field is empty on the clipboard, such as two spreadsheet cells of which the first is empty (`\t999`). Select one cell and paste.
- **Current:** The confirmation asks to paste 1 cell, and 999 goes into the selected cell. The paste trims the whole text before it splits it, which removes the leading tab.
- **Correct:** Two cells are pasted: the selected cell becomes empty (NULL) and 999 goes into the next column.
- **Tests:** `tests/table/clipboard.spec.ts`

## Columns and tables

### new-text-column-is-varchar

- **Steps:** Add a column of type Text with the "+" header cell.
- **Current:** The column is `character varying`.
- **Correct:** `text`, the default that `docs/docs/user-guide/data-types.md` names. The Text options save an unlimited column as `text`, and imports create `text` columns.
- **Tests:** `tests/columns/add-column.spec.ts`

### column-type-warning-without-change

- **Steps:** Open a table created outside Mathesar (its columns have no stored display settings). Click a column header.
- **Current:** The Data Type section shows "Data loss can result from changing the data type of a column. This action cannot be undone." with Cancel and Save before anything changed, also for primary key, foreign key and view columns whose select is disabled. Save sends a type change to the same type; on a view column it fails with "WrongObjectType: ALTER action ALTER COLUMN ... SET DATA TYPE cannot be performed on relation ...". Cancel does not remove the warning.
- **Correct:** Warning, Cancel and Save appear only once the type or its options change.
- **Cause:** `AbstractTypeControl.svelte` compares `JSON.stringify(metadata)` ("null") with `JSON.stringify(column.metadata ?? {})` ("{}").
- **Tests:** `tests/columns/data-type.spec.ts`

### default-value-without-input

- **Steps:** Column tab of a boolean (also number or date) column, Default Value, choose "Custom default", Save without choosing a value.
- **Current:** The request sends the text "null" as the default. Toast "InvalidTextRepresentation: invalid input syntax for type boolean: "null" SQLSTATE: 22P02"; Save and Cancel stay.
- **Correct:** Save is disabled until a value is given.
- **Tests:** `tests/columns/default-value.spec.ts`

### date-default-shows-unsaved

- **Steps:** Column tab of a date column, Default Value, "Custom default", type 03/15/2024, Enter, Save.
- **Current:** PostgreSQL stores `'2024-03-15'::date`, but Save and Cancel stay on screen as if the change were not saved (the API returns "2024-03-15 AD", the input holds "2024-03-15").
- **Correct:** Save and Cancel disappear after the save.
- **Tests:** `tests/columns/default-value.spec.ts`

### table-description-cannot-be-cleared

- **Steps:** Table tab of a table that has a description. Empty the Description field and Save.
- **Current:** Toast "There must be atleast one request". The field stays in edit mode, PostgreSQL keeps the comment. Cancel shows the old text again.
- **Correct:** The description is removed (comment NULL) and the field shows it empty. (A column description can be emptied.)
- **Cause:** `updateTable` in `stores/tables.ts` sends `tables.patch` only when `name || description` is truthy; `batchRun([])` throws.
- **Tests:** `tests/columns/table-tab.spec.ts`

### view-offers-new-column

- **Steps:** Open a view. Click "+" after the last column header, type a name, Add.
- **Current:** The form is offered; the database refuses: "WrongObjectType: ALTER action ADD COLUMN cannot be performed on relation "<view>" Detail: This operation is not supported for views. SQLSTATE: 42809" under the buttons.
- **Correct:** A view has no "+" header cell.
- **Tests:** `tests/columns/views-and-tables-without-pk.spec.ts`

### view-offers-delete-column

- **Steps:** Open a view. Right-click a column header, "Delete Column", confirm.
- **Current:** The entry is offered; toast "Unable to delete Column. WrongObjectType: ALTER action DROP COLUMN cannot be performed on relation "<view>" ...".
- **Correct:** The menu of a view column has no "Delete Column" (the inspector already offers none for views).
- **Tests:** `tests/columns/views-and-tables-without-pk.spec.ts`

## Login, users and profile

### password-page-without-login

- **Steps:** Log out. Open `/auth/password_reset_confirm/`. Type a password twice and submit.
- **Current:** The page shows the "Update Your Password" form to a visitor who is not logged in. The submission is answered with "Server Error (500)".
- **Correct:** The visitor is sent to the login page, as on every other page that needs a login.
- **Tests:** `tests/auth/forced-password-change.spec.ts`

### username-longer-than-63-characters

- **Steps:** Administration > Users > Add User. Type a username of 64 to 150 characters and a password. Save.
- **Current:** The form accepts the username, because its limit is 150 characters. The server stores at most 63, and the form shows "DataError: value too long for type character varying(63)". No user is created. The same happens when a user is renamed.
- **Correct:** The form and the server agree on one limit, and the form names it before saving. The `test.fixme` assumes a limit of 63.
- **Tests:** `tests/users/user-create.spec.ts`

### profile-title-lower-case

- **Steps:** Open `/profile/`.
- **Current:** The document title is "<username> | mathesar". The page asks for a translation key that does not exist, so the key itself is shown.
- **Correct:** "<username> | Mathesar", like the titles of the other pages.
- **Tests:** `tests/users/profile.spec.ts`

### user-delete-failure-list-stuck

- **Steps:** Administration > Users. Open a user and click "Delete User", then "Delete User" in the confirmation, while the server refuses the deletion. Click "Users" in the navigation on the left.
- **Current:** A toast shows the error and the user stays on the page of the user. The list of users then shows its loading placeholder and never the users, until the page is loaded again. The deletion marks the list as loading before it asks the server, and nothing ends that state when the server refuses.
- **Correct:** The list shows the users again, the one that was not deleted among them.
- **Tests:** `tests/users/user-delete.spec.ts`

## Databases and schema page

### page-load-fails-while-server-deleted (intermittent)

- **Steps:** Load a page of Mathesar while another session removes a server from Mathesar, for example by disconnecting the last database of a server with the option to remove the server too.
- **Current:** On rare occasions the page load answers 500 with `Server.DoesNotExist`. Every page lists all databases with their server, and the server is gone in between.
- **Correct:** Pages load normally. The databases of the removed server are no longer listed.
- **Tests:** none. The race needs a server removed at the same moment. Seen in parallel runs while `tests/databases/server-records.spec.ts` ran (round 2 audit).

### blank-database-nickname

- **Steps:** On the home page, click "Connect Database" and choose "Create a New Database". Type a database name. Choose "Use a custom nickname instead" and leave "Nickname" empty. Click "Create Database".
- **Current:** Mathesar stores the nickname as an empty text, `''`. The card shows only "(<name>)" and the server. Its link is named "Open database", with no name after it. The page of the database has an empty name in its header and the document title "| Mathesar". Edit Connection does the same with a blank nickname.
- **Correct:** Mathesar stores no nickname (`null`). The card shows the database name and the server, as it does for a database without a nickname.
- **Tests:** `tests/databases/connect-database.spec.ts`

### upgrade-offered-to-standard-users

- **Steps:** A connected database needs an upgrade, as databases do after Mathesar itself is upgraded. Sign in as a user who is not an admin and is a collaborator on that database. On the home page, click "Upgrade" on the card of the database. Click "Upgrade Database".
- **Current:** The card offers "Upgrade". The notice above the list offers "Upgrade All Databases". The upgrade form shows the error `Authentication failed when calling "databases.upgrade_sql"`. The database still needs an upgrade.
- **Correct:** The card still says "Upgrade Required". A user who is not an admin gets neither "Upgrade" nor "Upgrade All Databases".
- **Tests:** `tests/databases/upgrade-database.spec.ts`

### stale-upgrade-prompt-after-reinstall

- **Steps:** A connected database needs an upgrade. Its card has no link. Open the page of the database by its address, `/db/<id>/`. Open the menu in the header of that page and choose "Reinstall Mathesar Schemas". Click "Reinstall". Click the Mathesar logo to go back to the home page.
- **Current:** The card still says "Upgrade Required" and offers "Upgrade". The database itself no longer needs an upgrade. The prompt goes away when the page is loaded again.
- **Correct:** The card has its link again and no "Upgrade" button.
- **Tests:** `tests/databases/upgrade-database.spec.ts`

### schema-duplicate-check-ignores-case

- **Steps:** A database has a schema "Sales". On the page of the database, click "Create Schema". Type `sales`.
- **Current:** The form says "A schema with that name already exists." and "Create New Schema" is disabled. PostgreSQL would accept `sales` next to "Sales". The name `Sales` itself passes the check. The server then refuses it: `schema "Sales" already exists`.
- **Correct:** The check compares names exactly. The form refuses `Sales`. The name `sales` creates a new schema.
- **Tests:** `tests/databases/schema-list.spec.ts`, and `tests/schemas/schema-management.spec.ts` for the toast and the closed form after `Sales`.

### modal-ignores-click-outside

- **Steps:** On the page of a database, click "Create Schema". Wait until its window has slid in. Click beside the window, for example in the top left corner of the page.
- **Current:** Nothing happens. Confirmations, such as the one of "Delete Schema", behave the same. Both kinds of window close on Escape and are set to close on a click beside them too. The layer that positions the window covers the overlay, so the click does not reach the overlay. Only while the window slides in can a click near the top edge reach it.
- **Correct:** A click beside the window closes it.
- **Tests:** `tests/databases/shared-controls.spec.ts`

### schema-table-count-includes-views

- **Steps:** A schema has two tables and one view. On the schema page, click "New Table" and choose "From Scratch". Click "Proceed". In the breadcrumb, click the name of the database.
- **Current:** The row of the schema says "4 tables". The view is counted as a table. Loading the page again shows "3 tables". Renaming a table on the schema page, instead of creating one, also counts the view.
- **Correct:** "3 tables".
- **Tests:** `tests/schema-page/tables.spec.ts`

### exploration-renamed-to-nothing

- **Steps:** On the schema page, open the menu of an exploration and choose "Rename Exploration". Clear "Name". Click "Save".
- **Current:** The exploration is saved with an empty name. Its entry in the list shows no name, only "Based on <table>".
- **Correct:** "Save" is disabled while the name is empty.
- **Tests:** `tests/schema-page/explorations.spec.ts`

### exploration-rename-error-uncaught

- **Steps:** A schema has two explorations. On the schema page, open the menu of one of them and choose "Rename Exploration". Type the name of the other one. Click "Save".
- **Current:** A toast shows the error of the server, "duplicate key value violates unique constraint". The form stays open. The exploration keeps its name. The same error is also thrown in the browser without being caught.
- **Correct:** The toast and the open form, without the uncaught error.
- **Tests:** `tests/schema-page/explorations.spec.ts`

### exploration-duplicate-error-uncaught

- **Steps:** On the schema page, open the menu of an exploration and choose "Duplicate Exploration" while the server refuses to save the copy. It refuses, for example, when an exploration of another schema already has the name "Duplicate of <name>": names are unique in the whole installation, and the page picks the name from the explorations of its own schema.
- **Current:** A toast says "Failed to duplicate data exploration." followed by the error of the server. No copy is listed. The same error is also thrown in the browser without being caught.
- **Correct:** The toast, without the uncaught error.
- **Tests:** `tests/schema-page/explorations.spec.ts`

### form-renamed-to-nothing

- **Steps:** On the schema page, open the menu of a form and choose "Rename Form". The field "Name" shows the placeholder "<table> Form". Clear it. Click "Save".
- **Current:** The form is saved with an empty name. Its entry in the list shows no name, only "For <table>".
- **Correct:** The form is named "<table> Form", as a new form is when its name is left empty.
- **Tests:** `tests/schema-page/forms.spec.ts`

### form-gone-error-uncaught

- **Steps:** On the schema page, delete a form elsewhere, for example in another tab, while the page still lists it. Open the menu of the form and choose "Delete Form", then confirm. Or choose "Rename Form", change the name and click "Save".
- **Current:** Nothing tells the user that it failed. After "Delete Form" the form stays in the list. The rename form stays open. The error `DoesNotExist: Form matching query does not exist.` is thrown in the browser without being caught.
- **Correct:** A toast says why the form could not be deleted ("Unable to delete Form. ...") or renamed. No uncaught error.
- **Tests:** `tests/schema-page/forms.spec.ts`

## Roles, collaborators and privileges

### current-role-lookup-fails-on-dropped-role (intermittent)

- **Steps:** Run an action that reads the current role, such as saving a new form, while another session drops a role of the same server.
- **Current:** On rare occasions the request fails with an error that the dropped role does not exist. `msar.get_current_role()` lists the roles first and then calls `pg_has_role` for each name, so a role dropped in between breaks the whole call.
- **Correct:** Roles dropped while the lookup runs are skipped, and the action succeeds.
- **Tests:** none. The race needs a role dropped at the same moment. Seen once in a parallel run of `tests/databases/` (round 2 audit).

### record-page-ignores-column-update

- **Steps:** In PostgreSQL, give a role USAGE on a schema and SELECT on its table "Books". Give it UPDATE on the column "Pages" only: `GRANT UPDATE ("Pages") ON "Books" TO <role>`. Make a user who is not an admin a collaborator on the database with that role. As that user, open the page of a record of "Books".
- **Current:** Every field is disabled, "Pages" too. On the table page, the same user can edit "Pages".
- **Correct:** The field "Pages" can be changed and saved. The other fields stay disabled.
- **Tests:** `tests/access-control/record-access.spec.ts`

## Data Explorer

### summarize-in-data-explorer-not-saveable

- **Steps:** On the page of a table, right-click a column header and choose "Group by Column". In the inspector, open the "Table" tab. Click "Summarize in Data Explorer".
- **Current:** The Data Explorer counts the records of each group. "Save" is disabled, although the exploration is new and has columns. "Export" is a link to an address with `exploration_id=undefined`. The server answers that address with an error.
- **Correct:** "Save" is enabled. "Export" is disabled until the exploration is saved, as for any other new exploration.
- **Tests:** `tests/data-explorer/entry-points.spec.ts`

### referencing-table-column-named-after-base-table

- **Steps:** A table "Loans" refers to "Books" through its column "Book". In the Data Explorer, choose the base table "Books". Add its column "Title". Under "References To Base Table", open "Loans via Book" and click "Borrower". To the question "Summarize the Borrower column?", answer "No, continue without summarizing".
- **Current:** The new column is named "Books_Borrower", after the base table.
- **Correct:** "Loans_Borrower", after its own table. Columns of a table that the base table refers to are named this way already, such as "Authors_Name".
- **Tests:** `tests/data-explorer/building.spec.ts`

### sort-direction-label-not-updated

- **Steps:** In the Data Explorer, choose the base table "Books". Add its columns "Title", "Pages" and "Author". On the "Transform Results" tab, click "Add transformation step" and choose "Sort". The step starts on "Books_Title" with the direction "A-Z". Choose the number column "Books_Pages" instead.
- **Current:** The result is sorted by "Books_Pages", smallest first. The direction still reads "A-Z". Its options are "0-9" and "9-0".
- **Correct:** The direction reads "0-9".
- **Tests:** `tests/data-explorer/sorting-and-hiding.spec.ts`

### sort-step-offers-hidden-column

- **Steps:** In the Data Explorer, choose the base table "Books". Add its columns "Title", "Pages" and "Price". On the "Transform Results" tab, add a "Hide" step and pick "Books_Title" in it. Add a "Sort" step.
- **Current:** The Sort step starts on the hidden column "Books_Title". The result is replaced by "The result could not be displayed." with the error "SortFieldNotFound: 'Books_Title'".
- **Correct:** The Sort step starts on a column that is still shown, here "Books_Pages". The result is sorted by it.
- **Tests:** `tests/data-explorer/sorting-and-hiding.spec.ts`

### summarize-boolean-max-min-fails

- **Steps:** In the Data Explorer, choose the base table "Books". Add its columns "Author" and "In Stock", a boolean column. On the "Transform Results" tab, add a "Summarize" step. Under "Aggregate", open the function of "Books_In Stock" and choose "Max".
- **Current:** The functions offered for the boolean column are "List", "Count", "Median", "Mode", "Percentage True", "Max" and "Min". With "Max", the result shows the error "function max(boolean) does not exist". "Min" fails the same way.
- **Correct:** A boolean column offers "List", "Count", "Median", "Mode" and "Percentage True", without "Max" and "Min".
- **Tests:** `tests/data-explorer/summarization.spec.ts`

### summarize-not-aggregated-picker-resets-aggregations

- **Steps:** In the Data Explorer, choose the base table "Books". Add its columns "Author", "Title", "Pages" and "In Stock". On the "Transform Results" tab, add a "Summarize" step. It groups by "Books_Author". Under "Aggregate", click the cross next to "Books_In Stock". It moves to "Not Aggregated". Choose "Sum" for "Books_Pages". In "Not Aggregated", pick "Books_Title" as well.
- **Current:** "Books_Title" is grouped by and still aggregated as "List". The result has a column "Books_Title" and a column "Books_Title distinct list". "Books_Pages" is back to "List".
- **Correct:** "Books_Title" leaves "Aggregate". "Books_Pages" stays at "Sum". The result has the columns "Books_Author", "Books_In Stock", "Books_Title" and "Books_Pages sum".
- **Tests:** `tests/data-explorer/summarization.spec.ts`

### exploration-duplicate-name-not-detected

- **Steps:** A schema has an exploration named "Titles". In the Data Explorer of that schema, choose a base table and add columns. Click "Save". Type "Titles" as the name.
- **Current:** The form shows no error, and "Save" stays enabled. The form catches a taken name only when the name is all lower case. After "Save", a toast shows the error of the server, "duplicate key value violates unique constraint". The form closes. The exploration is not saved. The same error is also thrown in the browser without being caught.
- **Correct:** The form says "An Exploration with that name already exists." and "Save" is disabled.
- **Tests:** `tests/data-explorer/saving.spec.ts`

### exploration-dropped-column-no-recovery

- **Steps:** Save an exploration of "Books" with the columns "Title" and "Pages". Drop the column "Pages" in PostgreSQL, outside Mathesar. Open the exploration.
- **Current:** The result is replaced by "The result could not be displayed." and the error of the server, "KeyError: None". The refresh button reads "Retry". The result has no columns. The page offers no way to repair the exploration. The page has a message and the button "Attempt Exploration recovery" for this case, but shows them only for an error of the former REST API with the code 4418. The RPC API reports errors in another form, and the server sends no such code.
- **Correct:** The page says "Some of the columns present in the query are missing in the underlying base table." and offers "Attempt Exploration recovery". That button removes the missing column. The result then shows the columns that are left.
- **Tests:** `tests/data-explorer/broken-explorations.spec.ts`

### rpc-batch-cancel-uncaught-error

- **Steps:** Open a saved exploration on a slow connection. Before the column list on the left has loaded, change the description on the "Exploration" tab of the inspector. In Firefox and WebKit, leaving the page at that moment has the same effect.
- **Current:** The request for the column list is cancelled. The browser then reports the uncaught error "Response is not an array". The user sees nothing of it. Any batch request of the front end that is cancelled, or that cannot reach the server, ends in the same error.
- **Correct:** A cancelled request raises no error.
- **Tests:** `tests/data-explorer/entry-points.spec.ts`

### exploration-description-drops-space

- **Steps:** Open a saved exploration. On the "Exploration" tab of the inspector, type "Long " into the description and pause for a moment. Type "reads". Click "Save".
- **Current:** The space disappears from the text area during the pause, so the description reads "Longreads", and Save stores it. The description is trimmed 300 ms after each key, and the trimmed text replaces the text in the text area.
- **Correct:** The text area keeps what the user types. The description reads "Long reads". Spaces at its ends are removed when it is saved.
- **Tests:** `tests/data-explorer/inspector.spec.ts`

## Forms

### form-create-includes-user-column

- **Steps:** A table has two columns of the User type. One of them is chosen for "Last Editor Tracking". On the schema page, click "New Form". Choose that table and click "Save". Open the new form from the list.
- **Current:** The form has a field for the other user column. The form builder marks the field with "This column cannot be included in the form because user type fields require authentication and are not supported in forms. Please remove this field from the form."
- **Correct:** A new form leaves out every user column, as it already leaves out the one chosen for "Last Editor Tracking".
- **Tests:** `tests/forms/create-form.spec.ts`

### form-required-boolean-error-on-load

- **Steps:** Publish a form with a required boolean field. Open its public link as a visitor.
- **Current:** "Value cannot be empty." shows under the boolean field as soon as the page loads, and again after "Submit another response". It goes away after "Clear form". Required text, number, date and enum fields show the error only after the visitor emptied them.
- **Correct:** No error before the visitor touched the field.
- **Tests:** `tests/forms/public-form.spec.ts`

### form-share-error-toast-empty

- **Steps:** In the form builder, open Share and click "Create public link" while the server refuses the change. "Regenerate Link" and "Disable Link" behave the same.
- **Current:** An error toast without any text.
- **Correct:** The toast shows the message of the server, as a failed Save does.
- **Tests:** `tests/forms/share.spec.ts`

### form-add-new-record-before-load-keeps-list-open

- **Steps:** Publish a form with a foreign key field that may create a record. On the public page, open the list of records of that field and click "Add New Record" before the records have loaded.
- **Current:** The field switches to "Adding New Record" and shows the fields of the new record, but the list stays open, also after the records arrive. The next click on the input closes the list instead of opening it.
- **Correct:** The list closes, as it does when the records have loaded.
- **Tests:** `tests/forms/public-form-foreign-keys.spec.ts`

## Import and export

### import-upload-error-raw-json

- **Steps:** On the schema page, click "New Table" and choose "From Data Import". Choose an empty file to upload.
- **Current:** The toast shows the response of the server as it is: `{"errors": {"file": ["The submitted file is empty."], "__all__": ["One of ['file', 'paste'] should be specified."]}}`. Other errors of the import pages are shown as raw JSON too, for example the one for an image file, the error under the "Import" button of the import into a table, and the error of the preview of another user's import.
- **Correct:** The toast says "The submitted file is empty."
- **Tests:** `tests/import-export/upload.spec.ts`

### import-paste-answer-not-json

- **Steps:** On the import page, choose "Copy and Paste Text", paste data and click "Proceed", while the server answers the upload with a success status and a body that is not JSON, such as an HTML page from a proxy.
- **Current:** The page shows "Processing Data" and its spinner and never anything else. The browser reports the uncaught error "Unexpected token '<', ... is not valid JSON": the request reads the body inside its event handler and never settles.
- **Correct:** The page shows an error in place of the form, as it does when the upload fails in other ways, and throws nothing.
- **Tests:** `tests/import-export/upload.spec.ts`

### import-preview-phantom-rows

- **Steps:** Import a file that has a header row and no data rows, for example `Title,Pages`.
- **Current:** The preview shows two rows with `DEFAULT` in every cell. The server sends no records (`tables.get_import_preview` returns `null`), so the page keeps the two placeholder records that it shows while it loads.
- **Correct:** The preview shows no rows.
- **Tests:** `tests/import-export/preview.spec.ts`

### import-confirm-partly-applied

- **Steps:** Import a file with the columns Title, Pages and Published. In the preview, change the table name, rename "Pages" to "Title", uncheck "Published" and click "Confirm & create table".
- **Current:** A toast says `DuplicateColumn: column "Title" of relation "<new name>" already exists` and the preview stays. The requests of the confirmation run one by one, so the others take effect: the table has the new name, "Published" is gone and the import counts as confirmed, but no column has its suggested type ("Pages" stays text). Loading the page again opens the table page.
- **Correct:** A confirmation that fails changes nothing, and the import still waits for confirmation.
- **Tests:** `tests/import-export/preview.spec.ts`

### import-cancel-error-message-lost

- **Steps:** In the preview of an import, click "Cancel" (or "Delete Import") while the server fails to delete the table.
- **Current:** The toast says "Something went wrong." instead of the message of the server. The preview stays. The page keeps the error as text, and `toast.fromError` only takes the message of an `Error`.
- **Correct:** The toast shows the message of the server.
- **Tests:** `tests/import-export/preview.spec.ts`

### import-infers-prefix-as-money

- **Steps:** Import a file whose column holds `Row 1` and `Row 2`, with type inference on, and click "Confirm & create table".
- **Current:** The preview suggests Money and shows `$1` and `$2`. The table stores 1 and 2: the text is lost. The inference takes any prefix that all values share for a currency symbol (`msar.find_mathesar_money_attrs` in `db/sql/46_msar_type_inference.sql`).
- **Correct:** The column is suggested as Text and keeps the values as written.
- **Tests:** `tests/import-export/type-inference.spec.ts`

### table-import-guess-ignores-case

- **Steps:** On the page of a table with the columns Title, Pages and Published, click "Import" in the inspector and choose a file with the columns `PUBLISHED,Title`.
- **Current:** `PUBLISHED` is mapped to "Pages", by position. Names are compared without case only when the file has at least as many columns as the table.
- **Correct:** `PUBLISHED` is mapped to "Published".
- **Tests:** `tests/import-export/table-import.spec.ts`

### table-import-numeric-column-names

- **Steps:** On the page of a table with the columns Region, 2023 and 2024, click "Import" in the inspector and choose a file with the header `Region,2023,2024`.
- **Current:** The mapping lists the file columns as 2023, 2024, Region. "Import" fails with `Unable to import data into existing table. Parsing mismatch` and imports nothing. The modal reads the first row into an object, which puts keys that look like integers first, and sends those positions as column indexes. The server finds that they do not match the file.
- **Correct:** The file columns are listed in the order of the file, and the rows are imported.
- **Tests:** `tests/import-export/table-import.spec.ts`

### table-import-empty-file

- **Steps:** On a table page, click "Import" in the inspector and choose an empty file.
- **Current:** The browser reports the uncaught error "Cannot convert undefined or null to object". The modal shows the file and a spinner that never stops. "Import" stays disabled, and no message says why.
- **Correct:** The modal says that the file is empty and throws nothing.
- **Tests:** `tests/import-export/table-import.spec.ts`

## Navigation

### breadcrumb-selector-forms-not-loaded

- **Steps:** A schema has a form. Open the page of one of its tables by its address, for example by loading the page again. In the breadcrumb, open the selector "Choose a Table or Exploration" next to the name of the schema.
- **Current:** The section "Forms" says "No Forms" and does not list the form. On the schema page, the same selector lists it.
- **Correct:** The section "Forms" lists the form.
- **Tests:** `tests/navigation/breadcrumb-selectors.spec.ts`

### record-search-adds-two-history-entries

- **Steps:** On a table page, click the search button next to the table name in the breadcrumb and click a record. The same happens with "Find a Record" on the schema page and with the record button of a table in the breadcrumb selector. Press Back.
- **Current:** The record page stays. A second Back returns to the table. The click adds two history entries for the record page: the search calls `router.goto` and the router also follows the link. Choosing the record with Enter adds one.
- **Correct:** One Back returns to the page the search was opened on.
- **Tests:** `tests/navigation/routing.spec.ts`

### unknown-path-renders-two-pages

- **Steps:** As an admin, open `/db/<id>/nothing/` (or `/db/<id>/settings/nothing/`, or `/administration/nothing/`).
- **Current:** The page shows the database page (or the administration page) with its header, and below it a second app header with the error page "The page you're looking for doesn't exist." The breadcrumb names the database twice. The status is 200 for the database and 404 for the administration.
- **Correct:** Only the error page, with one header, as at an unknown address under a schema.
- **Tests:** `tests/navigation/not-found.spec.ts`

## Relationships and records

### record-modal-save-leaves-sheet-stale

- **Steps:** On a table page, open a record in the modal (the link in its primary key cell, or "Quick View Record"). Change a field and click "Save". Close the modal.
- **Current:** PostgreSQL holds the new value and the modal shows it, but the row in the sheet keeps the old value until "Refresh" or a reload. Nothing is fetched when the modal saves or closes. The same happens with a linked record field.
- **Correct:** The row in the sheet shows the saved values once the modal has saved.
- **Tests:** `tests/records/record-view-modal.spec.ts`

### multi-tagger-deletes-wrong-link

- **Steps:** Use a mapping table whose two link columns have attnums of 10 or more and come before its primary key, for example because nine columns were dropped before they were added. On the table page of one side, add the joined column with "Extend". Open the multi-tagger of a cell, check a record, then uncheck it again.
- **Current:** The uncheck deletes another row of the mapping table, the one whose id equals the id of the record of this cell. The new link stays. The multi-tagger takes the id of the new mapping row from the first column whose first digit is not the attnum of a link column, so it reads the link column with attnum 10.
- **Correct:** The uncheck deletes the mapping row that the check added.
- **Tests:** `tests/relationships/joined-columns.spec.ts`

### record-page-related-tables-error-uncaught

- **Steps:** Open the page of a record while the server fails to list the tables that link to its table (`tables.list_joinable`).
- **Current:** The page shows the summary of the record and an empty form: the columns load in one batch with that request, so they fail with it. There is no related table and no message, and the page throws an uncaught error: the `{#await}` block of the related tables has no `{:catch}`. The record view modal has the same block.
- **Correct:** The page shows the fields, says that the related records cannot be loaded and throws nothing.
- **Tests:** `tests/records/record-page.spec.ts`

### added-record-shown-twice

- **Steps:** On the page of a record, sort a table of records that link to it. While it still reads "Loading", type a value into its empty last row and press Enter.
- **Current:** The record is stored. Once the records have loaded, it shows twice: as a loaded record and as a new record below "New records will be repositioned on refresh". "Refresh", and the first second after the page opens, when the records load a second time, can do the same. There another load of the records can also start while the record is being added. Then the browser reports the uncaught error "Cannot read properties of undefined (reading 'identifier')": `RowCell.svelte` selects the last new record, which that load has removed. The table stays on "Loading".
- **Correct:** The new record shows once, and nothing is thrown.
- **Tests:** `tests/records/related-records.spec.ts`

### extract-form-fade-uncaught (intermittent)

- **Steps:** On a table page, select a column, click "Extract Column Into a New Table", name the new table and submit. Happens about once in three tries on an idle server, rarely under load. "Move Column To Linked Table" uses the same form.
- **Current:** The extraction works, but the browser reports the uncaught error "Cannot read properties of null (reading 'removeChild')". The table reloads while the closed form still fades out, the reload takes the extracted columns out of the selection, and the component that holds the form (shown only while columns are selected) is destroyed. At the end of the fade, the modal is destroyed a second time.
- **Correct:** No error.
- **Tests:** `tests/relationships/extract-and-move-columns.spec.ts`. No test can trigger the race on demand: the tests of that file that submit the form allow the error, and a `test.fixme` without the allowance asserts the correct behaviour.

### extract-new-column-focus (intermittent)

- **Steps:** On a table page, select a column, click "Extract Column Into a New Table", name the new table and submit.
- **Current:** The table reloads, the new link column is selected and its first cell gets the focus. When the reload ends before the closed form has faded out, which happens in about half of the tries on an idle server, the form gives the focus back to "Extract Column Into a New Table" as it disappears. The arrow keys then do not move the active cell.
- **Correct:** The first cell of the new link column keeps the focus.
- **Cause:** The `focusTrap` action of the modal focuses the element that had the focus when the modal opened. It does so when the modal leaves the page, at the end of its fade (150 ms).
- **Tests:** `tests/relationships/extract-and-move-columns.spec.ts`. The pinned test and the `test.fixme` stop the clock of the page until the table has reloaded. The test of the selection holds the records until the form is gone.

### unique-constraint-naming-unlabelled

- **Steps:** On a table page, open "Advanced" in the Table tab of the inspector, then "Constraints". Click "Add" under "Unique".
- **Current:** The radios "Automatically" and "Manually" have no label and no help. `NewUniqueConstraint.svelte` passes the label "Set Constraint Name" and its help to `RadioGroup` as default slot content, and `RadioGroup` only renders the slots `label` and `extra`.
- **Correct:** The radios are labelled "Set Constraint Name", with the help that explains constraint names, as in the form under "Foreign Keys", which passes them with `slot="label"`.
- **Tests:** `tests/relationships/constraints.spec.ts`

## Filter, sort, group and paging

### filter-column-menu-focus

- **Steps:** Right-click a column header of a type other than a foreign key and choose "Filter Column" (or "Add Filter").
- **Current:** The Filter dropdown opens with a new condition for the column, but the keyboard focus stays on the active cell of the sheet. Typing does not reach the value input.
- **Correct:** The value input of the new condition has the focus, as it has when the condition is added from the menu of columns of the Filter dropdown.
- **Tests:** `tests/table-view/filter-builder.spec.ts`

### filter-opened-while-loading

- **Steps:** Open a table page whose URL holds a filter. Open the Filter dropdown before the columns of the table have arrived.
- **Current:** The condition loses its column and its condition, and the browser reports "Cannot read properties of undefined (reading 'type')" once or twice. What follows depends on timing: the sheet shows no records, the status bar usually counts them, and it can stay on "Loading". The URL still holds the filter.
- **Correct:** The dropdown shows the condition once the columns have arrived, and the sheet shows the filtered records.
- **Tests:** `tests/table-view/url-state.spec.ts`

### filter-user-condition-focus

- **Steps:** Open the Filter dropdown of a table without filters and choose a user column from its menu of columns.
- **Current:** The condition is added, but the keyboard focus stays on the Filter button and the list of users does not open. The input of a user column drops the class by which the filter finds the value input of a new condition.
- **Correct:** The list of users opens with the focus in its search box, as the record selector opens for a foreign key column.
- **Tests:** `tests/table-view/filter-conditions.spec.ts`

### group-sort-direction-ignored

- **Steps:** In a table of 1,200 records, group by the column "Number" and sort the same column 9-0.
- **Current:** Page 1 holds the records with the largest numbers, 701 to 1,200, as the sort asks, but lists their groups in ascending order, from 701 up. Page 2 holds 201 to 700, also listed ascending. In a table that fits on one page, the groups stay in ascending order.
- **Correct:** The groups follow the sort: page 1 starts with the group 1,200 and goes down.
- **Tests:** `tests/table-view/group.spec.ts`

### json-array-not-empty-ignored

- **Steps:** Filter a column of JSON lists by the condition "array is not empty".
- **Current:** The condition filters nothing. Every record is shown, also those with an empty list or none. The condition compares the length of the list with 0, and that comparison is dropped as if its value were missing.
- **Correct:** Only the records whose list has at least one element are shown.
- **Tests:** `tests/table-view/filter-conditions.spec.ts`

### records-request-abort-uncaught

- **Steps:** Change the view (sort, filter, page) while the records of the previous change are still downloading. Switching to another table can do the same: the switch also reloads the records of the table the user left, because both tables share one pagination state.
- **Current:** The browser reports the uncaught error "AbortError: signal is aborted without reason". The user sees nothing of it, and the new records show. Only a request whose response has started to arrive is affected. `rpc-batch-cancel-uncaught-error` is the same kind of fault for batch requests.
- **Correct:** A cancelled request raises no error.
- **Tests:** `tests/table-view/requests-and-stability.spec.ts`. The other tests of `tests/table-view/` wait for the records of a view change before they make the next one (`expectLoadingEnded`). Only the Retry test of `tests/table-view/status-bar.spec.ts` allows the error: Retry shows while the other parts of the refresh may still load, and it cancels them. In `tests/navigation/`, the tests that switch tables allow it, since the switch is the only way into the race there.

### new-record-label-proceed

- **Steps:** Open a table page in a window about 600 pixels wide, where the status bar is between about 450 and 690 pixels wide.
- **Current:** The New Record button of the status bar reads "Proceed". In a window narrowed after the page opened, the button shows only its icon.
- **Correct:** The button shows only its icon, as in a window narrowed after the page opened.
- **Tests:** `tests/table-view/status-bar.spec.ts`

### page-jumper-enter

- **Steps:** In the status bar, click the page button ("Page 1 of 3"). Type a page number and press Enter.
- **Current:** Nothing happens. The page jumper stays open on the same page. Only the "Go" button works.
- **Correct:** Enter goes to the page typed, as "Go" does.
- **Browsers:** Chromium. In WebKit, Enter goes to the page typed. Firefox: see `page-jumper-enter-reloads`.
- **Tests:** `tests/table-view/pagination.spec.ts`

### page-jumper-enter-reloads (Firefox)

- **Steps:** Sort a table of 1,200 records. In the status bar, click the page button ("Page 1 of 3"). Type 2 and press Enter.
- **Current:** The table goes to page 2, then Firefox submits the form of the page jumper and loads the table page again with an empty query. The view is lost: page 1, no sort. The form in `PageJumper.svelte` handles `submit` without preventing the browser's own submission. "Go" goes to the page without the second load.
- **Correct:** Enter goes to the page typed and keeps the view, as "Go" does.
- **Tests:** `tests/table-view/pagination.spec.ts`

### page-size-beyond-last-page

- **Steps:** In a table of 1,200 records, choose the page size 100 and go to the last page (12). Choose the page size 500.
- **Current:** The sheet is empty. The status bar says "No records found" and "Page 12 of 0".
- **Correct:** A page that exists is shown, for example the last one: "Page 3 of 3".
- **Tests:** `tests/table-view/pagination.spec.ts`

### page-lost-on-load

- **Steps:** Go to page 2 of a table, then reload the page or open its URL in another tab.
- **Current:** Page 1 is shown, with the page size of the URL. The page number in the URL is set back to 1.
- **Correct:** The page of the URL is shown.
- **Tests:** `tests/table-view/url-state.spec.ts`

## Data types

### date-input-rolls-over-invalid-days

- **Steps:** In a date cell, type `02/30/2023` and press Enter.
- **Current:** 2023-03-02 is stored and shown, without a message.
- **Correct:** The input is refused, as PostgreSQL refuses `2023-02-30`, and nothing is stored.
- **Tests:** `tests/data-types/date.spec.ts`

### date-picker-day-names

- **Steps:** Open the editor of a date cell. Read the accessible names of the days in the calendar.
- **Current:** Every day is named "F j, +0000".
- **Correct:** Each day is named by its date, for example "March 15, 2024".
- **Tests:** `tests/data-types/date.spec.ts`

### time-long-12-hour-format-ignores-pm

- **Steps:** Set the Time Format of a time column to "Long time 12 hr". In a cell, type `09:05:30 PM` or `9:05:30 pm` and press Enter.
- **Current:** 09:05:30 is stored and the cell shows "09:05:30 am". Only `09:05:30 pm` (two-digit hour, lower case) is read as an afternoon time. The short 12 hour format reads `9:05 PM` as 21:05.
- **Correct:** 21:05:30 is stored.
- **Tests:** `tests/data-types/time.spec.ts`

### date-time-picker-drops-seconds

- **Steps:** Open the editor of a timestamp cell that holds `2024-03-15 13:45:10`, with the default time format (hours and minutes), and pick the 20th in the calendar. Or open a time cell that holds `13:45:10` and click the arrow above the hour.
- **Current:** 2024-03-20 13:45:00 and 14:45:00 are stored: the seconds are lost. With a time format that shows seconds, they are kept.
- **Correct:** 2024-03-20 13:45:10 and 14:45:10 are stored.
- **Tests:** `tests/data-types/date-time.spec.ts`, `tests/data-types/time.spec.ts`

### number-precision-lost-in-display

- **Steps:** Store 9007199254740993 in a bigint column and open the table.
- **Current:** The cell shows "9,007,199,254,740,992". A numeric with more than about 17 significant digits is also shown rounded, for example `12345678901234567890.123456789` as "12,345,678,901,234,567,000", though the stored value is exact.
- **Correct:** All digits are shown as stored.
- **Tests:** `tests/data-types/number.spec.ts`

### number-exponent-display

- **Steps:** Store 1e21 and 0.000000001 in a double precision column, and 123456789012345678901234567890.5 in a numeric column.
- **Current:** The cells show "121", "19" and "1.234567890123456829": the sign of the exponent that the browser writes for these numbers is dropped. The API sends the large numeric as a float (1.2345678901234568e+29).
- **Correct:** "1,000,000,000,000,000,000,000", "0.000000001" and "123,456,789,012,345,678,901,234,567,890.5".
- **Tests:** `tests/data-types/number.spec.ts`

### number-editor-rounds-to-decimal-places

- **Steps:** Set Decimal Places of a numeric column to 2. Open the editor of 1234567.891, type `1` at the start and press Enter. Or set Decimal Places of a money column to 0, open the editor of 1234.5 and do the same.
- **Current:** The editor shows the rounded value ("1,234,567.89", "1,235"), and the edit stores it rounded (11234567.89, 11235). Decimals that were only hidden in the display are lost.
- **Correct:** The editor shows the stored value in full, and an edit keeps its decimals.
- **Tests:** `tests/data-types/number.spec.ts`, `tests/data-types/money.spec.ts`

### multicurrency-money-shown-as-dollar-sign

- **Steps:** Store `ROW(12.5, 'EUR')` in a `mathesar_types.multicurrency_money` column and open the table.
- **Current:** The cell shows "$". Its editor opens empty.
- **Correct:** The cell shows the amount and the currency.
- **Tests:** `tests/data-types/money.spec.ts`

### read-only-checkbox-cell-throws-on-enter

- **Steps:** Open a table without a primary key that has a boolean column. Click a boolean cell and press Enter.
- **Current:** The uncaught error "Unable to update without primary key" is thrown. The value does not change.
- **Correct:** Enter does nothing on a read-only cell, as for the other cell types.
- **Tests:** `tests/data-types/boolean.spec.ts`

### formatting-save-needs-a-click

- **Steps:** Select a column. In the Formatting section, focus a select, open it with Enter, choose an option with the arrow keys and Enter.
- **Current:** The option changes, but Cancel and Save do not appear, so the change cannot be saved without the mouse. They appear only on a mouse press inside the section.
- **Correct:** Cancel and Save appear on any change.
- **Cause:** `ColumnFormatting.svelte` listens to `focus` on a `div`, which gets no focus event.
- **Tests:** `tests/data-types/formatting.spec.ts`

### formatting-select-ignores-first-click

- **Steps:** Change a formatting option and save it. Click a select of the Formatting section, of the same column or of another one.
- **Current:** The first click only shows Cancel and Save. The list opens on the second click.
- **Correct:** The first click opens the list.
- **Browsers:** Chromium. In Firefox and WebKit, the first click opens the list.
- **Tests:** `tests/data-types/formatting.spec.ts`

### early-dates-shown-in-the-20th-century

- **Steps:** Store `0044-03-15 BC` in a date column and `0001-01-01 00:00` in a timestamp column, and open the table.
- **Current:** The cells show "03/15/1944" and "01/01/1901 00:00". The API sends the right values ("0044-03-15 BC").
- **Correct:** The year and the era are shown as stored.
- **Tests:** `tests/data-types/edge-values.spec.ts`

### infinite-dates-shown-wrong

- **Steps:** Store `infinity` in a date column and `-infinity` in a timestamp column, and open the table.
- **Current:** The date cell shows "NULL" (the API sends `null`) and the timestamp cell shows ":".
- **Correct:** The cells show "infinity" and "-infinity".
- **Tests:** `tests/data-types/edge-values.spec.ts`

### special-numbers-shown-empty

- **Steps:** Store `NaN` and `Infinity` in a numeric column, and open the table.
- **Current:** Both cells are empty.
- **Correct:** The cells show "NaN" and "Infinity".
- **Tests:** `tests/data-types/edge-values.spec.ts`

### late-save-response-reverts-newer-edit

- **Steps:** Edit two cells of one record, one after the other, so that the save of the second cell is answered before the save of the first (a busy server or a slow network).
- **Current:** When the answer of the first save arrives, the second cell shows its old value again. The database holds the new value, which a reload shows.
- **Correct:** The second cell keeps its new value.
- **Cause:** `mergeUpdatedRecord` in `stores/table-data/records.ts` skips only the cells that are still saving, so the late answer overwrites a cell whose own save has finished.
- **Tests:** `tests/data-types/saving.spec.ts`

## File attachments

### upload-error-not-shown

- **Steps:** Upload a file that the server refuses, for example a file over the size limit of a public form, or while the storage fails.
- **Current:** The Upload File window closes at once without a message. The cell or field stays empty. The error ("Error uploading file" and the raw body of the response, such as `{"detail": "Max allowed file size is 1.0 MB"}`) shows only when the window opens the next time.
- **Correct:** The window stays open and shows "Error uploading file" with the reason ("Max allowed file size is 1.0 MB"), so that the user can pick another file.
- **Tests:** `tests/files/upload.spec.ts`, `tests/files/public-form.spec.ts`

### lightbox-info-button-named-filter

- **Steps:** Click the thumbnail of an image in a file cell. Look at the button "Info" under the image.
- **Current:** Its accessible name and its title are "Filter".
- **Correct:** Its name is "Info", as its label says.
- **Tests:** `tests/files/viewer.spec.ts`

### file-removal-loses-focus

- **Steps:** Click a file that is not an image in a file cell. Click "Remove" in its details, then "Remove" or "Cancel" in the confirmation. Press an arrow key.
- **Current:** The keyboard focus is on the page body. The arrow keys do not move the active cell until a cell is clicked. Escape in the confirmation, and the same steps in the lightbox of an image, leave the focus on the cell.
- **Correct:** The focus goes back to the file cell, and the keys move from there.
- **Tests:** `tests/files/viewer.spec.ts`

### file-upload-text-not-translated

- **Steps:** Set the display language of a user to French. Open the Upload File window of an empty file cell.
- **Current:** The title is French ("Télécharger fichier"), but the drop zone says "Drag a file here or click to browse a file from your computer", and the progress "Uploaded 0%", in English. The texts are written into `FileUpload.svelte` of the component library, which the import pages use too.
- **Correct:** The drop zone and the progress are in the display language.
- **Tests:** `tests/files/upload.spec.ts`
