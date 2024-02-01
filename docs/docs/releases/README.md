# Release notes

This is developer documentation to help with release notes. It is not published in our docs guide.

## How to generate release notes

1. Create an empty release notes file.

    For example:

    ```
    touch 1.2.3.md
    ```

1. Run this script to find PRs which have been merged but not yet included in the latest release notes file.

    ```
    ./find_missing_prs.sh
    ```

    (See comments within the script to better understand how it works.)

1. Open `missing_prs.csv` to see the PRs you need to add. Incorporate them into the release notes as you see fit. Save the release notes and commit them.

1. Re-run the script as needed. When more PRs are merged, they will appear in `missing_prs.csv`.

