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

- For small documentation improvements, we welcome PRs without any prior issues. For larger edits, please [open an issue](https://github.com/centerofci/mathesar/issues/new/choose) first to discuss your changes and get approval from the team before proceeding.

- Take care when choosing the git branch on which to base your edits
    - **Target `master`** if you have an important fix which needs to be published for the _currently-released_ version of Mathesar.
    - **Target `develop`** if you are adding/updating documentation along with yet-to-be-released changes to the product.

    The docs site is published from the `master` branch. This is important because we want to ensure that it reflects the latest *released* version of Mathesar so that docs readers who are installing or using Mathesar don't see content before it's actually applicable.

See our [Contribution guidelines](../CONTRIBUTING.md) for more information about our pull-request workflow.

For docs content, we adhere to [CiviCRM's Documentation Style Guide](https://docs.civicrm.org/dev/en/latest/documentation/style-guide/).

## MkDocs Material

- Our docs run on a distribution of [`mkdocs`](https://www.mkdocs.org/) called [`mkdocs-material`](https://squidfunk.github.io/mkdocs-material/). For basics of doc writing, see the [Writing your docs](https://www.mkdocs.org/user-guide/writing-your-docs/) section of `mkdocs` user guide.

- For some customization basics, see [Customization](https://squidfunk.github.io/mkdocs-material/customization/) section of `mkdocs-material`'s Getting started guide. To learn about some of `mkdocs-material`'s features (annotations, code blocks, content tabs, etc.), see its [Reference](https://squidfunk.github.io/mkdocs-material/reference/).

## Hosting

We use GitHub pages to host https://docs.mathesar.org/

Here's how this works:

1. In our main Mathesar repo, there's a branch called `gh-pages`.
1. The `gh-pages` branch is not like other branches though. It has nothing in common with `develop` or `master`. The files in that branch are static HTML files for the docs site.
1. Whenever GitHub sees new commits pushed to that branch, a GitHub action publishes the content to the live docs site.

## Publication process

Changes to documentation is published manually. This may change in the future.

## Versioning

- We use [mike](https://github.com/jimporter/mike) to publish docs for multiple versions of Mathesar.
- Mike integrates with mkdocs-material to provide a version switcher within the site header.

### How to publish a single version of Mathesar's docs

1. Check out the git branch corresponding to the version you'd like to publish. For example:

    ```
    git checkout master
    ```

    As a convention, we use branches named like `docs_1.2.3` to retain changes to documentation which are made after a specific release is tagged. So you may end up needing to check out (or even _create_) a branch like that.

1. Go to the `docs` directory within the project root.

    ```
    cd docs
    ```

1. Ensure you have the docs-related dependencies:

    ```
    pip install -r ./requirements.txt
    ```

    Note that these dependencies are different from the Mathesar application dependencies.

1. Pull the `gh-pages` branch locally.

    ```
    git pull origin gh-pages:gh-pages
    ```

    Note that you don't need to _checkout_ the `gh-pages` branch locally. This command just ensures that you have all the commits locally which have been made to that branch upstream.

1. Run mike

    ```
    mike deploy -u 1.2.3 latest
    ```

    Modify before running:

    - Change `1.2.3` to the version you want to deploy.
    - Keep `latest` in the command to set the version to be the latest one. Remove that string from the command if you are publishing a non-latest version.
    
    What this does:

    - Despite the very public-sounding name "deploy" this command actually only makes a commit on the `gh-pages` branch _locally_. You're not "deploying" anything here.
    - To make that commit, mike will run `mkdocs build` against the files in your current directory.

1. Preview the site

    ```
    mike serve
    ```

    This will let you open up a browser to preview the new site as GitHub will serve it from the `gh-pages` branch. You'll see the version switcher and be able to change it. However, it _won't_ allow you to test our custom version redirection behavior (described below).

    If you're not satisfied, you can always hard-reset the commit you made with mike before pushing.

1. Push your changes to GitHub

    ```
    git push origin gh-pages:gh-pages
    ```

1. Monitor publication status

    Open the [Actions](https://github.com/mathesar-foundation/mathesar/actions) tab in our GitHub repo and you should see a yellow indicator aside the top-most action. When this turns green, your changes are published and can be viewed on the live docs site.

### Now to manage our custom version redirection behavior

We have some custom code in `overrides/404.html` which is pretty weird!

- Here's the **problem** that code is intended to solve:

    At the time we switched to multi-version docs, Mathesar 0.1.7 (and several previous versions) had application code which rendered a hyperlink to the release notes of the latest stable release of Mathesar. This hyperlink was coded without any docs version path segments, so for example it would point to `https://docs.mathesar.org/releases/0.1.7/`. However, urls like that unfortunately don't resolve in a site built with mike because they don't point to a specific version. We can't change the hyperlink because it's in an already-released version of Mathesar, so we'd like to find a way of catching traffic to links like that. Our 404.html file is a somewhat hacky way of handling this problem.

- Interestingly, the GitHub Pages server will handle Page Not Found errors by serving the content from a 404.html file if present in the root of the `gh-pages` branch. It's worth noting that this is a bit unconventional. Most web servers do _not_ behave this way by default. Sean (who wrote our 404.html code) was not even easily able to identify a way to mimic this behavior locally. So it's hard to test without setting up a sandbox repo to be served by GitHub Pages.

- MkDocs (and by extension, mkdocs-material) features an extensible templating system that we leverage to alter the 404.html page which gets generated when mkdocs runs. When we use mike to publish a version, we end up with our custom 404.html page published in the version subdirectory of the live site. But being published in a subdirectory actually accomplishes nothing by itself because the GitHub Pages server doesn't look for 404.html pages in subdirectories. So additionally we have a symlink at the root which points to `latest/404.html`. Since mike also maintains a symlink to point `latest` to the latest version, GitHub is able to see the custom 404 page at the site root.

- Within 404.html we have some javascript. Here's how it works:

    1. It fetches the versions JSON blob that mike maintains.
    1. It checks the current URL to see if it contains a version specifier within the path.
    1. If the current URL has a version specifier, then it serves the 404 page.
    1. If the current URL has no version specifier, then the javascript code redirects to the same URL with `latest` prepended to the path.


### How to manage our customizations applied to the version switcher

- We have some customizations to the version switcher which are applied within the `extra.css` file.
- If you modify this, you'll need to port those modifications to all published versions so that the user experience is consistent when switching between versions.


## Page redirects

We use [`mkdocs-redirects`](https://github.com/mkdocs/mkdocs-redirects) to redirect pages internally when moving things around.

## Macros

We use the [`macros`](https://mkdocs-macros-plugin.readthedocs.io/en/latest/) plugin to show the same content in different places, and we generally put such content in the `snippets` directory.

## Placeholders

We use the [`placeholder`](https://mkdocs-placeholder-plugin.six-two.dev/usage/) plugin to allow the user to customize small tokens which get repeated throughout a page. Here's how it works:

1. Add a token like `PLACEHOLDER_NAME` in `placeholder-plugin.yaml` with a default value.
1. Put an input on the page to allow the reader to customize the value of the token.

    ```html
    <input data-input-for="PLACEHOLDER_NAME">
    ```

1. Then put the customized value anywhere in the page

    ```text
    xPLACEHOLDER_NAMEx
    ```



