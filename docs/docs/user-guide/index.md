# Mathesar User Guide

## How Mathesar works

Mathesar is a web application that gives you a spreadsheet-like interface to one or more PostgreSQL [databases](./databases.md). It lets technical and non-technical users collaborate directly with the same relational data, providing user-friendly access to your database's [schemas](./schemas.md), [tables](./tables.md), [relationships](./relationships.md), and so on &mdash; all comfortably within the limits of the PostgreSQL [privileges](./access-control.md) for the PostgreSQL role that you give to Mathesar. Your data appears in Mathesar exactly as it is structured in PostgreSQL, with some additional convenience features ease the process of working with related data while keeping it [normalized](./relationships.md#normalization).

You can use Mathesar with PostgreSQL data sets you already have. Point it at your database, and you'll have a powerful GUI admin tool to help with data entry, analytics, and internal back-office processes.

Or you can use Mathesar to build data sets and workflows from scratch, giving you a robust and highly scalable alternative to typical spreadsheet-based solutions.

The Mathesar application has a small internal database where it stores the [users](./users.md) you create, the database [connection credentials](./databases.md#connection) you add, the [data explorations](./data-explorer.md) you save, and a small amount of [metadata](./metadata.md) which you may configure. But all your _actual_ data lives in your PostgreSQL database &mdash; outside Mathesar. The extensive interoperability afforded by PostgreSQL means you'll always have control over your data should you later choose to use incorporate other tools into your workflow or abandon Mathesar altogether.

## About PostgreSQL {:#postgres}

PostgreSQL (aka "Postgres") is an industry-leading relational database management system which has been actively maintained by a vibrant community of open source contributors since the mid 1990's. It has since emerged as the dominant and defacto relational database solution in the open source world and beyond.

While the choice to support PostgreSQL in a product like Mathesar would be obvious, Mathesar has doubled down on our commitment to PostgreSQL by architecting the application to integrate very tightly with PostgreSQL. A large part of the Mathesar application logic actually runs _within the PostgreSQL database_ to which Mathesar connects. This architecture enables Mathesar's high performance and snappy UI by reducing the need for multiple network round trips between the Mathesar application and the PostgreSQL server. So Mathesar will be fast even when your PostgreSQL server is around the world from your Mathesar application server.

A short-term consequence of this development strategy is that, for the time being, Mathesar _only_ works with PostgreSQL databases. However we are hopeful that in the future we'll have the opportunity to leverage PostgreSQL's powerful [Foreign Data Wrapper](https://www.postgresql.org/docs/current/postgres-fdw.html) functionality to connect to other kinds of databases such as MySQL, SQLite, Oracle, MongoDB, and more.

Mathesar's tight integration with PostgreSQL also means that, in order to function, Mathesar needs to install a few [Mathesar-specific schemas](./schemas.md#internal) upon connecting to your PostgreSQL database.

