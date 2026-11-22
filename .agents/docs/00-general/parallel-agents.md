# Work split across agents

How to run several agents on one task when they share a branch, a working tree or a running stack, such as a rewrite of the front end or a large set of tests. Read this before you start a second agent on the same task.

## Before you start

- Give each agent its own files: a folder of specs, a page, a module. A file that several agents need, such as a shared page object, has one owner. The others only add to it and send a change of what exists to the owner.
- Give each agent a brief with its scope, the files it owns, how to check its work and where to record its progress. An agent reads its brief once, at the start. A rule you add later reaches a running agent only as a message.

## While they work

- Each agent keeps a progress file current: done and checked, in progress, not started, next step. An interrupt of the coordinating session can stop every agent it started, and a stopped agent cannot always be resumed. A fresh agent then continues from the progress file, after comparing it with git and the files on disk.
- An agent that edits files to try something works on a copy of the folder. A commit by another agent takes whatever is in the shared tree. To prove a test by breaking a component, the edit has to be in the shared tree, because `.agents/bin/e2e dev` serves the app from there; the production stack runs the image that `.agents/bin/e2e up` built. Make the edit while holding the locks of the test runs and of the commits (below), and revert it before releasing them. Or break the behaviour with `page.route` instead.
- Each test run writes to its own folder (`--output test-results/<name>`) and passes `--reporter=list`, since every run replaces the HTML report in `e2e/playwright-report/`. A run without `--output`, such as `.agents/bin/check e2e`, empties all of `test-results/` first.
- One test run at a time against one running stack: `.agents/docs/03-frontend/end-to-end-tests.md` says why. Agents take turns through a lock around the test runner, for example with `flock`, and through another lock around commits. Whoever starts a fresh stack runs the setup before handing it over. Before a run that skips the setup project (`--no-deps`), check that the admin can sign in, so that a broken stack gives one clear message instead of hundreds of failures.
- An agent reports a security problem only in its final message to the coordinator, never in a file: files can end up in a commit.

## Done

- A second agent that did not write the work reviews it. For tests, it breaks the app on purpose and checks that each test fails (rule 1 of "Rules for tests" in `e2e/README.md`).
- The coordinator reads every change before it lands, and has the whole suite run on a fresh instance after the last agent is done.

## History and review

- Before the PR, squash the many small commits into one commit per logical change (`.agents/docs/00-general/workflow.md`, "Commits"). After a squash, check that the final tree equals the old head (`git diff <old head> <new head>` prints nothing) and read each commit's diff: a squash can move a line into a commit whose topic it does not belong to.
- CodeRabbit reviews at most 300 files and skips a larger PR. Its path filters leave out lock files, images and data files such as CSV. Split the work into PRs below that size to get its review.
