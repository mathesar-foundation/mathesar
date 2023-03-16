# Contributing to documentation

## Edit documentation locally

1. Install requirements

    ```
    pip install -r requirements.txt
    ```

1. Start MkDocs

    ```
    mkdocs serve -a localhost:9000
    ```

## Reference

- Our docs run on a distribution of [`mkdocs`](https://www.mkdocs.org/) called [`mkdocs-material`](https://squidfunk.github.io/mkdocs-material/). For basics of doc writing, see the [Writing your docs](https://www.mkdocs.org/user-guide/writing-your-docs/) section of `mkdocs` user guide.

- For some customization basics, see [Customization](https://squidfunk.github.io/mkdocs-material/customization/) section of `mkdocs-material`'s Getting started guide. To learn about some of `mkdocs-material`'s features (annotations, code blocks, content tabs, etc.), see its [Reference](https://squidfunk.github.io/mkdocs-material/reference/).

- For page redirects, we use [`mkdocs-redirects`](https://github.com/mkdocs/mkdocs-redirects).

- For docs content, we adhere to [CiviCRM's Documentation Style Guide](https://docs.civicrm.org/dev/en/latest/documentation/style-guide/).

