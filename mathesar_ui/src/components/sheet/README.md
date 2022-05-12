This is a placeholder directory for the Sheet component which is meant to be implemented for use with Tables, Views and Data Explorer.

- This would be a lower-order component.
- It would encapsulate:
  - Rows
  - Cells
- It will _not_ include column headers.
- It would be a pure component and will _not_ hardcode requests from within the component.
  - They would be made on the parent components utilizing the Sheet component using callbacks, events and/or by exposing a Sheet API through slot.
