#!/usr/bin/env bash

function print_help {
    cat << EOF
Usage: $(basename $0) <VERSION_NUMBER>

Description:
    This script finds all the PRs that have been merged into the release branch
    but have not yet been included in the release notes.

Arguments:
    VERSION_NUMBER: (Required) e.g. "0.1.0"

Options:
    --help: Print this help message.
EOF
}

if [[ $# -eq 0 || "$1" == "--help" ]]; then
    print_help
    exit 0
fi

if ! type duckdb >/dev/null 2>&1; then
  echo "Error: This script requires DuckDB to be installed." \
    "The 'duckdb' command must be in your path." \
    "See installation instructions at:"
  echo "  https://duckdb.org/"
  exit 1
fi

if ! type gh >/dev/null 2>&1; then
  echo "Error: This script requires the GitHub CLI to be installed." \
    "The 'gh' command must be in your path." \
    "See installation instructions at:"
  echo "  https://cli.github.com/"
  exit 1
fi

RELEASE=$1
NOTES_FILE=$RELEASE.md
TEMPLATE_FILE=TEMPLATE.md

# If the notes file doesn't yet exist, create one
if [ ! -f $NOTES_FILE ]; then
  cp $TEMPLATE_FILE $NOTES_FILE
  # Note: We're not using the `-i` option to sed because it's not portable
  sed "s/__VERSION__/$RELEASE/g" $NOTES_FILE > $NOTES_FILE.tmp
  mv $NOTES_FILE.tmp $NOTES_FILE
fi

PREV_NOTES_FILE=$(ls -1 | sort | grep -B 1 $NOTES_FILE | head -n 1)
PREV_RELEASE=$(echo $PREV_NOTES_FILE | sed s/.md$//)

CACHE_DIR=cache
COMMITS_FILE="$CACHE_DIR/commits.txt"
ALL_PRS_FILE="$CACHE_DIR/all_prs.json"
INCLUDED_PRS_FILE="$CACHE_DIR/included_prs.txt"

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

mkdir -p "$CACHE_DIR"

# Find and cache the hashes for all the PR-merge commits included in the release
# branch but not included in the master branch.
git log --format=%H $PREV_RELEASE..$RELEASE_BRANCH > $COMMITS_FILE

ONE_YEAR_AGO=$(python3 -c "
from datetime import datetime, timedelta
one_year_ago = datetime.utcnow() - timedelta(days=365)
print(one_year_ago.strftime('%Y-%m-%d'))")

# Find and cache details about all the PRs merged within the past year. This
# gets more PRs than we need, but we'll filter it shortly.
gh pr list \
  --limit 1000 \
  --json additions,author,deletions,mergeCommit,title,url \
  --search "is:closed merged:>$ONE_YEAR_AGO" \
  --jq 'map({
      additions: .additions,
      mergeCommit: .mergeCommit.oid,
      title: .title,
      url: .url
    })' > $ALL_PRS_FILE

# Find and cache the URLs to any PRs that we've already referenced in the
# release notes.
grep -Eo 'https://github\.com/mathesar-foundation/mathesar/pull/[0-9]+' \
  $NOTES_FILE > $INCLUDED_PRS_FILE

# Generate a CSV containing details for PRs that match commits in the release
# but not in the release notes.
PR_LIST=$(echo "
  SELECT
    '- ' || pr.title ||
    ' _[#' || regexp_extract(pr.url, '(\d+)$', 1) || ']' ||
    '(' || pr.url || ' \"' || replace(pr.title, '\"', '') || '\")_' AS link
  FROM read_json('$ALL_PRS_FILE', auto_detect=true) AS pr
  JOIN read_csv('$COMMITS_FILE', columns={'hash': 'text'}) AS commit
    ON commit.hash = pr.mergeCommit
  LEFT JOIN read_csv('$INCLUDED_PRS_FILE', columns={'url': 'text'}) AS included
    ON included.url = pr.url
  WHERE included.url IS NULL
  ORDER BY pr.additions DESC;" | \
  duckdb -ascii -noheader -newline $'\n')

if [ -z "$PR_LIST" ]; then
  echo "No missing PRs"
  exit 0
fi

echo $'\n\n## (TO CATEGORIZE)\n' >> $NOTES_FILE
echo "$PR_LIST" >> $NOTES_FILE
echo $'\n' >> $NOTES_FILE
COUNT=$(wc -l <<< "$PR_LIST")
echo "$COUNT PRs added to $NOTES_FILE. Please categorize them."
