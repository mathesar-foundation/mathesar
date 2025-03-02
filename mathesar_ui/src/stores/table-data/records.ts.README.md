# Developer notes for `records.ts`

We have some confusing **mess** in `records.ts` that badly needs refactoring!

This file is Sean's attempt at documenting the mess so that future devs (including me) can either work within the mess or refactor it!

## Relevance

This file was created in 2025-02.

Check git blame to see when this file was last updated. Consider that content here may well be stale if the referenced code has changed!

## Row ids

Our `Row` type unfortunately doesn't have a defacto field to uniquely identifies rows. Instead, we seem to have a proliferation of _different_ (and incompatible) identifiers used variously in different contexts. Here is a summary:

- `rowIndex`
    - Type: number
    - Persistence: **stored** in `RecordRow`
    - Origin: generated sequentially within `preprocessRecords`
    - Used
        - to display the number in the row header cell (though it's not _exactly_ the number that eventually gets displayed)
        - in `identifier`
    - Notes:
        - The placeholder row gets a stored rowIndex even though it doesn't display it right away. This is because the placeholder row gets converted to a real row when the user enters data into it, and at that point it needs to display the number in the row header cell.

- `identifier`
    - Type: string
    - Persistence: **stored** in `Row`
    - Origin: generated via `generateRowIdentifier`
        - `__${offset}_${type}_${rowIndex}`
        - `offset` comes from pagination
        - `type` is the type of row: 'groupHeader' | 'normal' | 'dummy' | 'new'
    - Used:
        - In `selectionId` (always)
        - In `rowKey` (sometimes)
        - To compare two rows when making incremental store updates

-  `rowSelectionId` aka `selectionId` aka `rowId`
    - Type: string
    - Persistence: **computed** on the fly
    - Origin: generated via `getRowSelectionId`
        - returns `identifier`
    - Used:
        - as keys in `RecordsData.selectableRowsMap`
        - to form `cellId` values via `makeCellId`
        - when deleting selected rows

- `recordId` aka `recordPk`
    - Type: ResultValue
    - Persistence: **computed** on the fly
    - Origin:
        - adhoc inline logic in multiple places
        - generated via `getPkValueInRecord` (which might throw)
    - Used:
        - in _lots_ of places!

- `rowKey`
    - Type: string
    - Persistence: **computed** on the fly
    - Origin: generated via `getRowKey`
        - this returns `identifier` or stringified `recordId`
    - Used:
        - as keys in `Meta.rowStatus`,
        - as keys in `Meta.rowCreationStatus`
        - as keys in `Meta.rowDeletionStatus`
        - as keys in `Meta.rowsWithClientSideErrors`
        - in some places that actually expect a PK (ugh!) (e.g. `recordPk={rowKey}`)
        - within `getCellKey`

- `itemKey` aka `iterationKey`
    - Type: string
    - Persistence: **computed** on the fly
    - Origin: generated via `getIterationKey` in (`Body.svelte`)
        - this returns `rowKey` or `__index_${index}`
    - Used:
        - as the key to distinguish rows within the VirtualList

## Cell ids

Likewise, _cells_ also need id, but we have two different kinds! Don't get them mixed up!!

- `key` aka `cellKey`
    - Type: string
    - Persistence: **computed** on the fly
    - **Uses `rowKey` values**
    - Origin: generated via `getCellKey`
        - `${String(rowKey)}${CELL_KEY_SEPARATOR}${columnId}`
    - Used in:
        - `Meta.cellModificationStatus`, `modificationStatusMap`
        - `RecordsData.updatePromises`

- `cellId` aka `cellSelectionId`
    - Type: string
    - Persistence: **computed** on the fly
    - **Uses `rowSelectionId` values**
    - Origin: generated via `makeCellId`
        - `JSON.stringify([rowId, columnId]);`
    - Used in:
        - `SheetSelection` (to track which cells are selected)
        - DOM `data-cell-selection-id` attribute in order to construct cell selections


