# Mathesar's Documentation

This directory contains the source code for Mathesar's user and administrator documentation published to https://docs.mathesar.org/

## Preview your documentation edits locally

1. Install requirements

    ```
    pip install -r requirements.txt
    ```

1. Start MkDocs

    ```
    mkdocs serve -a localhost:9000
    ```

1. Preview the docs at http://localhost:9000

1. Keep mkdocs running while you edit and your local preview will refresh automatically.

## Contribution process

- For small documentation improvements, we welcome PRs without any prior issues. For larger edits, please [open an issue](https://github.com/mathesar-foundation/mathesar/issues/new/choose) first to discuss your changes and get approval from the team before proceeding.

- Take care when choosing the git branch on which to base your edits
    - **Target `master`** if you have an important fix which needs to be published for the _currently-released_ version of Mathesar.
    - **Target `develop`** if you are adding/updating documentation along with yet-to-be-released changes to the product.

    The docs site is published from the `master` branch. This is important because we want to ensure that it reflects the latest *released* version of Mathesar so that docs readers who are installing or using Mathesar don't see content before it's actually applicable.

See our [Contribution guidelines](../CONTRIBUTING.md) for more information about our pull-request workflow.

## Reference

- Our docs run on a distribution of [`mkdocs`](https://www.mkdocs.org/) called [`mkdocs-material`](https://squidfunk.github.io/mkdocs-material/). For basics of doc writing, see the [Writing your docs](https://www.mkdocs.org/user-guide/writing-your-docs/) section of `mkdocs` user guide.

- For some customization basics, see [Customization](https://squidfunk.github.io/mkdocs-material/customization/) section of `mkdocs-material`'s Getting started guide. To learn about some of `mkdocs-material`'s features (annotations, code blocks, content tabs, etc.), see its [Reference](https://squidfunk.github.io/mkdocs-material/reference/).

- For page redirects, we use [`mkdocs-redirects`](https://github.com/mkdocs/mkdocs-redirects).

- We use the [`macros`](https://mkdocs-macros-plugin.readthedocs.io/en/latest/) plugin to show the same content in different places, and we generally put such content in the `snippets` directory.

- We use the [`placeholder`](https://mkdocs-placeholder-plugin.six-two.dev/usage/) plugin to allow the user to customize small tokens which get repeated throughout a page. Here's how it works:

    1. Add a token like `PLACEHOLDER_NAME` in `placeholder-plugin.yaml` with a default value.
    1. Put an input on the page to allow the reader to customize the value of the token.

        ```html
        <input data-input-for="PLACEHOLDER_NAME">
        ```

    1. Then put the customized value anywhere in the page

        ```text
        xPLACEHOLDER_NAMEx
        ```

- For docs content, we adhere to [CiviCRM's Documentation Style Guide](https://docs.civicrm.org/dev/en/latest/documentation/style-guide/).

