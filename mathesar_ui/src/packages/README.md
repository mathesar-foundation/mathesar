# Packages

This directory contains general-purpose packages which could (theoretically) be used outside of Mathesar.

- **Currently**: code in these packages uses ESM imports to reference code

- **In the future**: we want to convert our entire Mathesar repository to a monorepo and transform these packages into actual npm packages. They wouldn't necessarily be _published_ on npm, but they'd become self-contained at that point, unable to import/export at the ESM level, but only at the package level.

Until then, this directory serves as a sort of staging ground to help make that transition easier.
