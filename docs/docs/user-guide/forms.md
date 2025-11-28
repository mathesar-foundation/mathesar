# Forms in Mathesar

Mathesar includes a powerful Form Builder that allows users to design
custom forms for collecting data. Forms provide a structured, user-friendly
way to input information into tables without exposing the full table
interface.

---

## What are Forms?

Forms act as simplified data-entry interfaces that map directly to a table
in your database. You can choose which columns should appear in the form,
configure input types, and publish the form for internal or public use.

Forms are especially useful for:
- Collecting data from non-technical users
- Standardizing data entry workflows
- Restricting access so users only submit information, not view or edit
  other records
- Creating public submission workflows (e.g., surveys, applications, feedback)

---

## Creating a Form

To create a new form:

1. Navigate to the **Forms** section in Mathesar.
2. Select **Create Form**.
3. Choose the table the form should be connected to.
4. Select which fields (columns) should appear.
5. Configure field options such as:
   - Input type (text, number, date, etc.)
   - Required fields
   - Default values
   - Help text or descriptions

Once saved, the form becomes available for data entry.

---

## Managing Forms

After creation, you can manage your forms from the **Forms Dashboard**.

You can:
- Edit the form layout  
- Modify fields  
- Reorder fields  
- Preview the form  
- Delete or unpublish the form  

Changes are automatically reflected for users.

---

## Publishing Forms

Mathesar supports publishing forms in two modes:

### 1. **Internal Forms**
Only authenticated Mathesar users can access and submit responses.

### 2. **Public Forms**
These forms can be shared externally using a link. Anyone with the link
can submit data—no Mathesar account required.

Public forms are useful for:
- Surveys
- Feedback forms
- Registration forms
- Anonymous reporting

---

## Submitting Data

When users submit a form, the data is automatically written to the
connected table. Validation rules ensure that the submitted data meets the
constraints defined in the table schema.

Submissions appear alongside other rows in the table, where they can be
reviewed, filtered, or edited by authorized users.

---

## Limitations (Current)

- Forms currently map to **one table at a time**
- Advanced conditional logic is not yet supported
- Form styling options are limited in this version

These features may be expanded in future releases.

---

## Summary

Forms make data collection in Mathesar simple and structured. By defining
a controlled interface for input and optionally enabling public access,
you can build powerful workflows on top of your database without needing
any external tools.

