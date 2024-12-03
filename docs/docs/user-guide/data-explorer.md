# Mathesar's Data Explorer

The Data Explorer provides rudimentary support for some basic reporting and analytics tasks.

You can: 

- View the data across multiple tables 
- Filter
- Sort
- Summarize data to see aggregate values

After you've constructed an exploration, you can save it to easily run it later as well.

## Exploration and access controls

- The Data Explorer will now allow you to modify any data. It is a read-only reporting tool.

- Your ability to view data in the Data Explorer is determined by the privileges of your PostgreSQL [role](./roles.md).

- All [collaborators](./collaborators.md) can see (and modify) the same set of explorations. (This is the same way that access control works for [metadata](./metadata.md)).

- Keep in mind that if a collaborator is using a different role, they may see different data through the Data Explorer due to their role's access controls.

