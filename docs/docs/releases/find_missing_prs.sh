#!/usr/bin/env bash

## DEPENDENCIES
##
## This script requires the following things to be installed:
##
## - The GitHub CLI: https://cli.github.com/
## - DuckDB: https://duckdb.org/

COMMITS_FILE=cache/commits.txt
ALL_PRS_FILE=cache/all_prs.json
INCLUDED_PRS_FILE=cache/included_prs.txt
MISSING_PRS_FILE=missing_prs.csv

# Use the latest release notes file
NOTES_FILE=$(ls -1 | grep -e '^[0-9]\.[0-9]\.[0-9]' | sort | tail -n 1)

# Assume the release version number to match the file name
RELEASE=$(echo $NOTES_FILE | sed s/.md$//)

# See all our local branches
BRANCHES=$(git branch --format="%(refname:short)")

# Find the release branch. If we've already cut a branch for the release (and we
# have it locally), then use that. Otherwise, use "develop".
RELEASE_BRANCH=$(
  if echo $BRANCHES | grep -q $RELEASE; then
    echo $RELEASE
  else
    echo "develop"
  fi
)

# Find and cache the hashes for all the PR-merge commits included in the release
# branch but not included in the master branch.
git log --format=%H --first-parent master..$RELEASE_BRANCH > $COMMITS_FILE

# Find and cache details about all the PRs merged within the past year. This
# gets more PRs than we need, but we'll filter it shortly.
gh pr list \
  --base $RELEASE_BRANCH \
  --limit 1000 \
  --json additions,author,deletions,mergeCommit,title,url \
  --search "is:closed merged:>$(date -d '1 year ago' '+%Y-%m-%d')" \
  --jq 'map({
      additions: .additions,
      author: .author.login,
      deletions: .deletions,
      mergeCommit: .mergeCommit.oid,
      title: .title,
      url: .url
    })' > $ALL_PRS_FILE

# Find and cache the URLs to any PRs that we've already referenced in the
# release notes.
grep -Po 'https://github\.com/mathesar-foundation/mathesar/pull/\d*' \
  $NOTES_FILE > $INCLUDED_PRS_FILE

# Generate a CSV containing details for PRs that match commits in the release
# but not in the release notes.
echo "
  SELECT
    pr.title,
    pr.url,
    pr.author,
    pr.additions,
    pr.deletions,
    '[#' || regexp_extract(pr.url, '(\d+)$', 1) || '](' || pr.url || ')' AS link
  FROM read_json('$ALL_PRS_FILE', auto_detect=true) AS pr
  JOIN read_csv('$COMMITS_FILE', columns={'hash': 'text'}) AS commit
    ON commit.hash = pr.mergeCommit
  LEFT JOIN read_csv('$INCLUDED_PRS_FILE', columns={'url': 'text'}) AS included
    ON included.url = pr.url
  WHERE included.url IS NULL
  ORDER BY pr.additions DESC;" | \
  duckdb -csv > $MISSING_PRS_FILE

