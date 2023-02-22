<p align="center">
    <img src="https://user-images.githubusercontent.com/845767/218793207-a84a8c9e-d147-40a8-839b-f2b5d8b1ccba.png" width=450px alt="Mathesar logo"/>
</p>
<p align="center"><b>An intuitive UI for managing data, for users of all technical skill levels. Built on Postgres.</b></p>
<p align="center">
    <img alt="License" src="https://img.shields.io/github/license/centerofci/mathesar">
    <img alt="GitHub closed issues" src="https://img.shields.io/github/issues-closed/centerofci/mathesar">
    <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/centerofci/mathesar">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/centerofci/mathesar">
</p>

<p align="center">
  <a href="https://mathesar.org?ref=github-readme" target="_blank">Website</a> • <a href="https://docs.mathesar.org?ref=github-readme" target="_blank">Docs</a> • <a href="https://wiki.mathesar.org/en/community/matrix" target="_blank">Matrix (chat)</a> • <a href="https://wiki.mathesar.org/" target="_blank">Wiki</a>
</p>


# Mathesar

Mathesar is a straightforward open source tool that provides a **spreadsheet-like interface** to a PostgreSQL **database**. Our web-based interface helps you and your collaborators work with data more independently and comfortably – **no technical skills needed**.

You can use Mathesar to build **data models**, **enter data**, and even **build reports**. You host your own Mathesar installation, which gives you ownership, privacy, and control of your data.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Status](#status)
- [Join our community!](#join-our-community)
- [Screenshots](#screenshots)
- [Features](#features)
- [Self-hosting](#self-hosting)
- [Local development setup](#local-development-setup)
- [Our motivation](#our-motivation)
- [Contributing](#contributing)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Status
- [x] **Pre-release**: Initial development, not yet ready for deployment.
- [ ] **Public Alpha**: You can install and deploy Mathesar on your server. Go easy on us!
- [ ] **Public Beta**: Stable and feature-rich enough to implement in production
- [ ] **Public**: Production-ready

We are currently in Public Alpha.

## Join our community!
The Mathesar team is on [Matrix](https://wiki.mathesar.org/en/community/matrix) (chat service). We also have [mailing lists](https://wiki.mathesar.org/en/community/mailing-lists) and the core team discusses day-to-day work on our developer mailing list. 

## Screenshots
![crm-table](https://user-images.githubusercontent.com/287034/220773466-1790a826-923e-47a8-8f7e-1edb67970a16.png)
![authors-filter](https://user-images.githubusercontent.com/287034/220773378-78e05984-5f0f-4ed2-9682-b75ca0f6867c.png)
![talks-with-topics](https://user-images.githubusercontent.com/287034/220773633-0a4ff810-a1e1-476f-b5b0-2667ba97f07a.png)
![author-record](https://user-images.githubusercontent.com/287034/220773738-a3fd0dda-cf16-45ed-a8ef-4e40647bb074.png)
![arxiv-schema](https://user-images.githubusercontent.com/287034/220773323-bd6ffb31-835b-4df5-981e-dae6341d42bb.png)
![db-page](https://user-images.githubusercontent.com/287034/220773522-8c1c1483-2389-4f5e-83b2-e54836983035.png)

## Features
- **Built on Postgres**: Connect to an existing Postgres database or set one up from scratch.
- **Set up your data models**: Easily create and update Postgres schemas and tables.
- **Data entry**: Use our spreadsheet-like interface to view, create, update, and delete table records.
- **Filter, sort, and group**: Quickly slice your data in different ways.
- **Query builder**: Use our Data Explorer to build queries without knowing anything about SQL or joins.
- **Schema migrations**: Transfer data between tables in two clicks.
- **Uses Postgres features**: Mathesar uses and manipulates Postgres schemas, primary keys, foreign keys, constraints and data types. e.g. "Links" in the UI are foreign keys in the database.
- **Custom data types**: Custom data types for emails and URLs (more coming soon), validated at the database level.
- **Basic access control**: Users can have Viewer (read-only), Editor (can only edit data, but not data structure), or Manager (can edit both data and its structure) roles.

## Self-hosting
Please see [our documentation](https://docs.mathesar.org/) for instructions on installing Mathesar on your own server.

## Local development setup
Please see [our guide in our documentation](http://docs.mathesar.org/contributing/local-dev/).

## Our motivation
Mathesar is a non-profit project. Our goal is to make understanding and working with data easy for everyone.

Databases have been around for a long time and solve common data problems really well. But working with databases often requires custom software. Or complex tooling that people struggle to get their heads around.

We want to make existing database functionality more accessible, for users of all technical skill levels.

## Contributing
We actively encourage contribution! Read through [our contributing guidelines](https://wiki.mathesar.org/community/contributing) to get started.

## License
Mathesar is open source under the GPLv3 license - see [LICENSE](LICENSE). It also contains derivatives of third-party open source modules licensed under the MIT license. See the list and respective licenses in [THIRDPARTY](THIRDPARTY).
