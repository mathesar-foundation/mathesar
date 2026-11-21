# Known bugs

Behaviour that is wrong today and that the suite asserts as it is. `README.md` explains why and how to retire an entry.

Each entry names the pinned test (tag `@known-bug`) and the `test.fixme` that asserts the correct behaviour.

## Table page

### sheet-shift-click-row-number

- **Steps:** Click the row number of a record. Shift-click the row number of another record.
- **Current:** Only the cells of the first column are selected in the rows in between.
- **Correct:** All cells of those rows are selected, as a drag across the row numbers does and as a shift-click on a column header does for columns.
- **Tests:** `tests/table/selection.spec.ts`

### sheet-keyboard-navigation-stops-on-scroll

- **Steps:** Open a table with more records than fit on the screen. Click a cell near the top. Press ArrowDown until the active cell reaches the lower edge.
- **Current:** When the sheet scrolls for the first time, all rows are rendered again. The active cell loses the keyboard focus, which moves to the page body. Further key presses scroll the sheet and no longer move the active cell. Navigation to the right in a wide table is not affected.
- **Correct:** The active cell keeps moving, stays focused and is scrolled into view.
- **Tests:** `tests/table/scrolling.spec.ts`

### sheet-initial-focus (intermittent)

- **Steps:** Open a table page. Press an arrow key without clicking anything.
- **Current:** The first cell is marked active. On most loads it also has the keyboard focus. On some loads the focus stays on the page body and the keys do nothing until a cell is clicked.
- **Correct:** The first cell has the keyboard focus on every load.
- **Tests:** `tests/table/selection.spec.ts` (`test.fixme` only. The current behaviour differs between loads, so no test pins it.)

### inspector-open-record-with-several-records

- **Steps:** Select several records, for example by dragging across row numbers. Look at the Record tab of the inspector.
- **Current:** The tab still offers "Quick View Record" and "Open Record". The link of "Open Record" ends in `/undefined`.
- **Correct:** The actions that work on one record are not offered while several records are selected.
- **Tests:** `tests/table/inspector-sync.spec.ts`
