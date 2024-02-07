# Sheet

The Sheet components help us display things in a spreadsheet-like format for the table page and the data explorer.

## `data-sheet-element` values

We use the `data-sheet-element` HTML attribute for CSS styling and JS functionality. The values are:

- `header-row`: The top most row of the sheet. It contains the column header cells.
- `data-row`: Used for the remaining rows, including (for now) non-standard ones like grouping headers which don't contain data.
- `positionable-cell`: Cells that span multiple columns or are taken out of regular flow e.g. "New records" message, grouping headers, etc.
- `origin-cell`: The cell in the top-left corner of the sheet.
- `column-header-cell`: Contains the column names.
- `new-column-cell`: Contains the `+` button for adding a new column.
- `row-header-cell`: Contains the row numbers.
- `data-cell`: Regular data cells.
