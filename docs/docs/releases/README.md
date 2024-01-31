# Release notes

This is developer documentation to help with release notes. It is not published in our docs guide.

## How to generate release notes

1. Run the `find_missing_prs.sh` script, passing the release version number as the only argument.

    ```
    ./find_missing_prs.sh 1.2.3
    ```

    - You can run this any time during the development cycle. If there is not yet a release branch, the script will compare `develop` to the previous release.
    - If you haven't yet created a release notes file for this release, it will create one for you.
    - The script will find PRs which have been merged but not yet included in the release notes file.

1. Open `missing_prs.csv` to see the PRs you need to add. Incorporate them into the release notes as you see fit. Save the release notes and commit them.

1. Re-run the script as needed. When more PRs are merged, they will appear in `missing_prs.csv`.

