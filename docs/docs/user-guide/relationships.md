# Relationships

Relationships allow a single cell in one table to reference a row in another table. When one table references another in this manner, the two tables are said to be "related". This is a core feature of PostgreSQL, and it allows us to model complex data structures using multiple tables.

## Example

Let's say we are maintaining an address book of people and their contact info...

???+ failure "Without Relationships"

    Associating multiple email addresses with one person is tricky! We might try the following approaches:

    - Option 1: Email addresses combined into a single column:

        | name | emails |
        | - | - |
        | Alice Roberts | alice@example.com, aroberts@example.net |
        | Bob Davis | bob@example.com |

    - Option 2: Email addresses spread across multiple columns

        | name | email_1 | email_2 |
        | - | - | - |
        | Alice Roberts | alice@example.com | aroberts@example.net |
        | Bob Davis | bob@example.com | |

    - Option 3: People spread across multiple rows

        | name | email |
        | - | - |
        | Alice Roberts | alice@example.com |
        | Alice Roberts | aroberts@example.net |
        | Bob Davis | bob@example.com |

    None of these options are ideal. They make it difficult to query the data, and they make it easy to introduce errors.

???+ success "With Relationships"

    We can create _two_ tables:

    The `people` table:

    | id | name |
    | - | - |
    | 1 | Alice Roberts |
    | 2 | Bob Davis |

    The `emails` table:

    | id | email | person |
    | - | - | - |
    | 1 | alice@example.com | 1 |
    | 2 | aroberts@example.net | 1 |
    | 3 | bob@example.com | 2 |

    And we configure the `person` column to **reference** the `id` column in the `people` table, ensuring that all the references are valid. The database handles this validation for us, and even prevents us from deleting a person without deleting their associated email addresses too.

## Normalization

This practice of modeling data through multiple related tables is called **data normalization**, and it's why a database will typically have its data spread across many tables, each with their own unique column structure, and very few tables providing much use or value in isolation. In the example above, the approaches without relationships are not normalized, while the approach with relationships is normalized.

Normalized data structures are more efficient to query and update, and they help to ensure data integrity by reducing redundancy and minimizing the risk of inconsistencies. But they can also be more cumbersome to work with manually due to the indirection inherent in having data spread across multiple tables. Mathesar helps you manage this complexity by providing a user-friendly interface to work with normalized data.

## Foreign key constraints in PostgreSQL

In PostgreSQL, references are called "[foreign key constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)", or simply "foreign keys". These constraints are set on the table to ensure that the data in the referencing column always points to a valid row in the referenced table.

## Reference columns in Mathesar

Mathesar identifies reference columns in your database by looking for foreign key constraints set in PostgreSQL. And when you create a reference column in Mathesar, it will automatically create the necessary foreign key constraint in PostgreSQL.

As noted below, reference columns get some extra features too!

### Record summaries {:#record-summaries}

Without Mathesar, reference cells are typically rather opaque. Often they contain only an id number, which is not very helpful when you're trying to understand the data.

Mathesar helps solve this problem by providing a feature called "record summaries" which allows you to see a short text summary of the referenced record directly in the referencing cell. By default, the record summary will be the value of the first text-like column in the referenced table. You can customize the record summary to show any columns and text you choose.

To customize a record summary, you can either:

- Start from the referenced table, and:

    1. Go to the table page of the referenced table.
    1. In the table inspector on the right, click on the "Table" tab.
    1. Find the "Record Summary" section below.

    *or*

- Start from a reference column, and:

    1. Go to the table page containing the reference column.
    1. Select the reference column or a cell within it.
    1. In the table inspector on the right, click on the "Column" tab.
    1. Find the "Linked Record Summary" section below.

### Record selector

Reference columns also provide a "record selector" tool which helps you search through referenced records when modifying reference values. It allows you to search on all columns from the referenced table and will use fuzzy logic to find the most relevant records. You can even create new records directly from the record selector.

### Limitations of Mathesar's reference columns

- Mathesar does not support "composite" foreign keys &mdash; foreign keys that reference _multiple_ columns in the referenced table at once.

- Some PostgreSQL databases might contain normalized data which is implicitly structured to utilize the concept of references but which lacks the foreign key constraints necessary to ensure data integrity. Mathesar will not treat such columns as references. It only recognizes foreign key columns as references.

## Relationship types and patterns

### One-to-many relationships

To illustrate a one-to-many relationship we'll re-use our example above.

- We'll have a `people` table as follows:

    | id | name |
    | - | - |
    | 1 | Alice Roberts |
    | 2 | Bob Davis |

- And an `emails` table as follows:

    | id | email | person |
    | - | - | - |
    | 1 | alice@example.com | `Alice Roberts` |
    | 2 | aroberts@example.net | `Alice Roberts` |
    | 3 | bob@example.com | `Bob Davis` |

    !!! note
        Here the reference column, `person`, displays with formatting to mimic Mathesar's record summaries feature.

Now **one** person can have **many** email addresses, hence the name "one-to-many".

### Many-to-one relationships

A many-to-one relationships is structurally equivalent to a one-to-many relationships, but with the perspective reversed. The two terms are often used interchangeably.

### Many-to-many relationships

Continuing our address book example, let's pretend we'd like to apply tags to our contacts. For example, we'd like to:

- Tag Alice Roberts as "colleague"
- Tag Bob Davis as "friend" and "colleague"

We can use three tables to model this relationship:

- A `people` table (as before):

    | id | name |
    | - | - |
    | 1 | Alice Roberts |
    | 2 | Bob Davis |

- A new `tags` table:

    | id | tag |
    | - | - |
    | 1 | colleague |
    | 2 | friend |

- And a new `people_tags` table (sometimes referred to as a "join table" or "mapping table"):

    | id | person | tag |
    | - | - | - |
    | 1 | `Alice Roberts` | `colleague` |
    | 2 | `Bob Davis` | `friend` |
    | 3 | `Bob Davis` | `colleague` |

Now people can have **many** tags and tags can have **many** people, hence the name "many-to-many".

### Other types of relationships

More esoteric relationships are possible too. For example:

- One-to-one relationships can be created by applying a unique constraint to the reference column. This is sometimes useful in more complex situations.
- Hierarchical data structures can be modeled using self-referential relationships.
- Polymorphic relationships can be modeled through a [variety of different patterns](https://hashrocket.com/blog/posts/modeling-polymorphic-associations-in-a-relational-database).

## Creating relationships

1. First, create the tables you want to relate.
1. From the table page of either table, open the "Table" tab within the table inspector, and find the "Relationships" section.
1. Click on the "Create relationship" button, and follow the prompts.

Alternatively, you can manually add a foreign key constraint to an existing column with the following steps:

1. Open the "Table" tab within the table inspector.
1. Open the "Advanced" section at the bottom.
1. Click on the "Constraints" button.
1. Next to "Foreign Key", click on "Add".

