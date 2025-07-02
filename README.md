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
  <a href="https://mathesar.org?ref=github-readme" target="_blank">Website</a> • <a href="https://docs.mathesar.org?ref=github-readme-top" target="_blank">Docs</a> • <a href="https://wiki.mathesar.org/en/community/matrix" target="_blank">Matrix (chat)</a> • <a href="https://discord.gg/enaKqGn5xx" target="_blank">Discord</a> • <a href="https://wiki.mathesar.org/" target="_blank">Contributor Wiki</a>
</p>


# Mathesar
Mathesar is a web application that makes working with PostgreSQL databases both simple and powerful. It empowers users of all technical skill levels to view, edit, query, and collaborate on data with a familiar spreadsheet-like interface—no code needed. It’s self hosted, can be deployed in minutes, and works directly with PostgreSQL databases, schemas, and tables without extra abstractions. The project is 100% open source and maintained by Mathesar Foundation, a 501(c)(3) nonprofit.

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
- **Import and export data**: Import and export data into Mathesar easily to work with your data elsewhere.
- **Schema migrations**: Transfer columns between tables in two clicks.
- **Uses Postgres features**: Mathesar uses and manipulates Postgres schemas, primary keys, foreign keys, constraints and data types. e.g. "Relationships" in the UI are foreign keys in the database.
- **Custom data types**: Custom data types for emails and URLs, validated at the database level.

## Screenshots
### Connecting a database
![connect-db](https://github.com/user-attachments/assets/d7188c8d-a040-4bc4-8350-28b2a6fd1661)

### Adding collaborators
![add-collaborator](https://github.com/user-attachments/assets/9bac7016-4a15-4a76-9abb-427dd6369305)

### Viewing a Postgres schema
![schema-page](https://github.com/user-attachments/assets/59c89bed-d240-4de4-ad33-91625ebe20ab)

### Working with tables
![table-inspector](https://github.com/user-attachments/assets/89212249-2fd6-4ef6-a4ef-3e4df32bfb89)

### Finding a nested record
![record-selector](https://github.com/user-attachments/assets/d88f4787-9994-4b56-a92f-322205abc6a1)

### Linking two tables together
![relationship-creation](https://github.com/user-attachments/assets/4240955e-3bc5-4f9c-ad4e-eac79cf42e63)

### Managing table permissions
![table-permissions](https://github.com/user-attachments/assets/74357082-3bf1-47c0-bf85-6c5eab77ef0f)

### Viewing a single record with related records
![record-page](https://github.com/user-attachments/assets/d2e621e3-5597-44ef-ae87-482bec0b9bcc)

### Viewing an Exploration (query result)
![viewing-exploration](https://github.com/user-attachments/assets/410cb99f-a583-411b-9706-7967bff673e6)

### Building an Exploration (query)
![building-exploration](https://github.com/user-attachments/assets/de662d3c-1efa-42e6-a960-17e00432c8db)

### Disconnecting a database
![disconnect-db](https://github.com/user-attachments/assets/f22e9c78-3c92-40c8-8ef9-dcb4cf8e8aea)

## Mathesar in action
https://github.com/user-attachments/assets/6bdfb178-17b4-4abf-aac4-9781e1d841ab

## Our motivation
Using databases shouldn't require technical expertise or expensive, closed-off tools. Databases are incredibly powerful, but they're often trapped behind complex interfaces that are hard to use or limit how people can access and share their data. We want to change that by building user-friendly tools that unlock the power of existing databases without sacrificing accessibility, portability, or extensibility.

Mathesar is our answer: an open-source platform designed to unlock the full potential of PostgreSQL, one of the most powerful and trusted open-source databases. Mathesar is easy to use, interoperable, and extensible, while also giving you complete control over your data. As a nonprofit, we're committed to keeping Mathesar 100% open source and available to everyone—because better ways to work with data mean better decisions, and better decisions lead to a better world.

## Bugs and troubleshooting
If you run into problems, refer to our [troubleshooting guide](./TROUBLESHOOTING.md).

## License
Mathesar is open source under the GPLv3 license - see [LICENSE](LICENSE). It also contains derivatives of third-party open source modules licensed under the MIT license. See the list and respective licenses in [THIRDPARTY](THIRDPARTY).
