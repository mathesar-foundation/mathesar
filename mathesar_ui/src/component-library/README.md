This directory contains the components and design system used by MathesarUI. This will be spun off into a package of it's own at a later point in time.

## Dev guidelines

- Ensure that files within this directory do not import any file outside the scope of the directory.
- Ensure that the styles for the components do not depend on styles specified outside the scope of the directory.
- All component styles should be global, the classes should be static and not auto-generated.
