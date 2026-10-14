<p align="center">
    <img src="https://user-images.githubusercontent.com/845767/218793207-a84a8c9e-d147-40a8-839b-f2b5d8b1ccba.png" width=450px alt="Mathesar logo"/>
</p>
<p align="center"><b>Intuitive spreadsheet-like interface that lets users of all technical skill levels view, edit, query, and collaborate on Postgres data directly—self hosted, with native Postgres access control.</b></p>
<p align="center">
    <img alt="License" src="https://img.shields.io/github/license/mathesar-foundation/mathesar">
    <img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/mathesar-foundation/mathesar">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/mathesar-foundation/mathesar">
</p>

<p align="center">
  <a href="https://mathesar.org?ref=github-readme" target="_blank">Website</a> • <a href="https://docs.mathesar.org?ref=github-readme-top" target="_blank">Docs</a> • <a href="https://mathesar.cloud" target="_blank">Mathesar Cloud</a> • <a href="https://wiki.mathesar.org/community/matrix/" target="_blank">Matrix (chat)</a> • <a href="https://discord.gg/enaKqGn5xx" target="_blank">Discord</a> • <a href="https://wiki.mathesar.org/" target="_blank">Contributor Wiki</a> • <a href="https://github.com/orgs/mathesar-foundation/projects/2" target="_blank">Roadmap</a>
</p>

# Mathesar

Mathesar is a web application that makes working with PostgreSQL databases both simple and powerful. It empowers users of all technical skill levels to view, edit, query, and collaborate on data with a familiar spreadsheet-like interface, with no code needed. It’s self hosted, can be deployed in minutes, and works directly with PostgreSQL databases, schemas, and tables without extra abstractions. The project is 100% open source and maintained by Mathesar Foundation, a 501(c)(3) nonprofit.

Mathesar is as scalable as Postgres and supports any size or complexity of data, making it ideal for workflows involving production databases. It requires minimal setup, and integrates into your existing infrastructure. Because Mathesar is self-hosted, your data never leaves your servers, and access control based on Postgres roles and privileges keeps your database secure without adding unnecessary risk.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Status](#status)
- [Install Mathesar](#install-mathesar)
- [Join our community](#join-our-community)
  - [Contribute to Mathesar](#contribute-to-mathesar)
- [Features](#features)
- [Screenshots](#screenshots)
  - [Connecting a database](#connecting-a-database)
  - [Adding collaborators](#adding-collaborators)
  - [Viewing a Postgres schema](#viewing-a-postgres-schema)
  - [Working with tables](#working-with-tables)
  - [Finding a nested record](#finding-a-nested-record)
  - [Linking two tables together](#linking-two-tables-together)
  - [Managing table permissions](#managing-table-permissions)
  - [Viewing a single record with related records](#viewing-a-single-record-with-related-records)
  - [Building a form](#building-a-form)
  - [Filling out a form](#filling-out-a-form)
  - [Viewing an Exploration (query result)](#viewing-an-exploration-query-result)
  - [Building an Exploration (query)](#building-an-exploration-query)
  - [Disconnecting a database](#disconnecting-a-database)
- [Mathesar in action](#mathesar-in-action)
- [Our motivation](#our-motivation)
- [Bugs and troubleshooting](#bugs-and-troubleshooting)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Status

- [x] **Public Alpha**: You can install and deploy Mathesar on your server. Go easy on us!
- [x] **Public Beta**: Stable and feature-rich enough to implement in production
- [ ] **Public**: Widely used in production environments

We are currently in the **public beta** stage.

## Install Mathesar

Please see [our documentation](https://docs.mathesar.org/?ref=github-readme-installing) for instructions on installing Mathesar on your own server.

Want to use Mathesar without installing it? [Mathesar Cloud](https://mathesar.cloud) is in now early beta and has a free plan.

## Join our community

The Mathesar team is on [Matrix](https://wiki.mathesar.org/en/community/matrix) (chat service). We also have [mailing lists](https://wiki.mathesar.org/en/community/mailing-lists) and the core team discusses day-to-day work on our developer mailing list.

### Contribute to Mathesar

We actively encourage contribution! Get started by reading our [Contributor Guide](./CONTRIBUTING.md).

## Features

- **Built on Postgres**: Connect to an existing Postgres database or set one up from scratch.
- **Install in minutes**: Install using Docker in minutes, integrate into any existing infrastructure.
- **Postgres-based access control**: Use existing Postgres roles within Mathesar's UI, or set up your own.
- **Interoperable with other tools**: Mathesar works harmoniously alongside your database and thousands of other tools in the Postgres ecosystem.
- **Set up your data models**: Easily create and update Postgres schemas and tables.
- **Data entry**: Use our spreadsheet-like interface to view, create, update, and delete table records.
- **Filter, sort, and group**: Quickly slice your data in different ways.
- **Query builder**: Use our Data Explorer to build queries without knowing anything about SQL or joins.
- **Forms**: Build and share forms to collect data from anyone via a unique link, with submissions automatically saved as new records.
- **Import and export data**: Import and export data into Mathesar easily to work with your data elsewhere.
- **Schema migrations**: Transfer columns between tables in two clicks.
- **Uses Postgres features**: Mathesar uses and manipulates Postgres schemas, primary keys, foreign keys, constraints and data types. e.g. "Relationships" in the UI are foreign keys in the database.
- **Custom data types**: Custom data types for emails and URLs, validated at the database level.

## Screenshots

### Connecting a database

<p align="center">
  <img src="./assets/readme/screenshots/01-connect-db.png" width="900" alt="Mathesar dialog for creating a PostgreSQL database with sample dataset options." />
</p>

### Adding collaborators

<p align="center">
  <img src="./assets/readme/screenshots/02-add-collaborator.png" width="900" alt="Mathesar collaborators page showing a read-only user added to the showcase database." />
</p>

### Viewing a Postgres schema

<p align="center">
  <img src="./assets/readme/screenshots/03-schema-page.png" width="900" alt="Mathesar schema page showing the Library Management tables, forms, and explorations." />
</p>

### Working with tables

<p align="center">
  <img src="./assets/readme/screenshots/04-table-inspector.png" width="900" alt="Mathesar table view for ice cream shop timesheets with the table inspector open." />
</p>

### Finding a nested record

<p align="center">
  <img src="./assets/readme/screenshots/05-record-selector.png" width="900" alt="Mathesar table view with nested record selection open for choosing a timesheet employee." />
</p>

### Linking two tables together

<p align="center">
  <img src="./assets/readme/screenshots/06-relationship-creation.png" width="900" alt="Mathesar relationship creation interface for linking two PostgreSQL tables." />
</p>

### Managing table permissions

<p align="center">
  <img src="./assets/readme/screenshots/07-table-permissions.png" width="900" alt="Mathesar table permissions interface showing read-only and custom role privileges." />
</p>

### Viewing a single record with related records

<p align="center">
  <img src="./assets/readme/screenshots/08-record-page.png" width="900" alt="Mathesar single-record page for a library item with related checkout records visible." />
</p>

### Building a form

<p align="center">
  <img src="./assets/readme/screenshots/09-form-builder.png" width="900" alt="Mathesar form builder for a bike shop service request form with field rules open." />
</p>

### Filling out a form

<p align="center">
  <img src="./assets/readme/screenshots/10-form-fill-example.png" width="900" alt="Public Mathesar service request form being filled with a mechanic search." />
</p>

### Viewing an Exploration (query result)

<p align="center">
  <img src="./assets/readme/screenshots/11-viewing-exploration.png" width="900" alt="Mathesar exploration page showing bike shop customers with related service requests." />
</p>

### Building an Exploration (query)

<p align="center">
  <img src="./assets/readme/screenshots/12-building-exploration.png" width="900" alt="Mathesar Data Explorer query builder showing a service request list aggregation." />
</p>

### Disconnecting a database

<p align="center">
  <img src="./assets/readme/screenshots/13-disconnect-db.png" width="900" alt="Mathesar confirmation dialog for disconnecting the showcase database." />
</p>

## Mathesar in action

https://github.com/user-attachments/assets/6bdfb178-17b4-4abf-aac4-9781e1d841ab

## Our motivation

Using databases shouldn't require technical expertise or expensive, closed-off tools. Databases are incredibly powerful, but they're often trapped behind complex interfaces that are hard to use or limit how people can access and share their data. We want to change that by building user-friendly tools that unlock the power of existing databases without sacrificing accessibility, portability, or extensibility.

Mathesar is our answer: an open-source platform designed to unlock the full potential of PostgreSQL, one of the most powerful and trusted open-source databases. Mathesar is easy to use, interoperable, and extensible, while also giving you complete control over your data. As a nonprofit, we're committed to keeping Mathesar 100% open source and available to everyone. Better ways to work with data mean better decisions, and better decisions lead to a better world.

## Bugs and troubleshooting

If you run into problems, refer to our [troubleshooting guide](./TROUBLESHOOTING.md).

## License

Mathesar is open source under the GPLv3 license - see [LICENSE](LICENSE). It also contains derivatives of third-party open source modules licensed under the MIT license. See the list and respective licenses in [THIRDPARTY](THIRDPARTY).
